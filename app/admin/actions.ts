"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAdmin, signOut } from "@/auth";
import {
  categories,
  slugify,
  type OptionChoice,
  type OptionGroup,
  type Plan,
  type PriceRule,
  type Product,
  type ProductType,
} from "@/lib/products";
import {
  anonymiseCustomer,
  countAdmins,
  deleteOrder,
  deleteProduct,
  deleteProductImage,
  deleteUser,
  findUserByEmail,
  getOrder,
  markFulfilled,
  orderStatuses,
  renameProductImage,
  saveProductImage,
  updateOrderStatus,
  upsertProduct,
  type OrderStatus,
} from "@/lib/repo";
import { fulfillmentEmail, sendMail, type MailAttachment } from "@/lib/email";

import { IMAGE_TYPES, MAX_IMAGE_BYTES, readImageField } from "@/lib/uploads";

export type ActionState = { error?: string; ok?: string };

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/** Splits a textarea/CSV field into clean lines. */
const lines = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((v) => v.trim())
    .filter(Boolean);

/**
 * Every action re-checks the session. A guard in the admin layout protects the
 * pages, not the action endpoints.
 */
const guard = async () => (await currentAdmin()) !== null;

/* ---------------- products ---------------- */

function parsePlans(fd: FormData): Plan[] {
  const names = fd.getAll("planName").map(String);
  const metas = fd.getAll("planMeta").map(String);
  const prices = fd.getAll("planPrice").map(String);
  const notes = fd.getAll("planNote").map(String);
  const badges = fd.getAll("planBadge").map(String);
  const ids = fd.getAll("planId").map(String);

  const plans: Plan[] = [];
  names.forEach((name, i) => {
    const clean = name.trim();
    const rawPrice = (prices[i] ?? "").trim();
    // A row with no name is an empty row the admin added by accident — skip it.
    // A row with a name but no price is a mistake — also skipped, and the
    // "add at least one plan" error below catches it if it was the only row.
    if (!clean || !rawPrice) return;

    const price = Number(rawPrice);
    if (!Number.isFinite(price) || price < 0) return;

    plans.push({
      id: ids[i]?.trim() || `PLAN-${Date.now().toString(36).slice(-4)}-${i}`,
      name: clean,
      meta: lines(metas[i] ?? ""),
      price: Math.round(price),
      ...(notes[i]?.trim() ? { note: notes[i].trim() } : {}),
      ...(badges[i]?.trim() ? { badge: badges[i].trim() } : {}),
    });
  });
  return plans;
}

/**
 * Validates the option matrix. It arrives as JSON from the form because the
 * structure is nested — see OptionsEditor. Every priced combination must carry
 * a price, otherwise the customer would reach checkout with a Rs. 0 total.
 */
function parseOptions(raw: string): {
  groups?: OptionGroup[];
  prices?: PriceRule[];
  error?: string;
} {
  if (!raw.trim()) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "The option matrix could not be read. Reload and try again." };
  }

  const data = parsed as { groups?: unknown; prices?: unknown };
  if (!Array.isArray(data.groups) || data.groups.length === 0) {
    return { error: "Add at least one option group." };
  }

  const groups: OptionGroup[] = [];

  for (const entry of data.groups) {
    const g = entry as Partial<OptionGroup>;
    const id = String(g.id ?? "").trim();
    const label = String(g.label ?? "").trim();
    if (!id || !label) return { error: "Every option group needs a heading." };

    const choices: OptionChoice[] = [];
    for (const choiceEntry of Array.isArray(g.choices) ? g.choices : []) {
      const c = choiceEntry as Partial<OptionChoice>;
      const cid = String(c.id ?? "").trim();
      const clabel = String(c.label ?? "").trim();
      if (!cid || !clabel) {
        return { error: `Every choice in "${label}" needs a label.` };
      }
      const note = String(c.note ?? "").trim();
      choices.push({ id: cid, label: clabel, ...(note ? { note } : {}) });
    }
    if (choices.length === 0) {
      return { error: `"${label}" needs at least one choice.` };
    }

    const kind = g.kind === "multi" ? "multi" : "select";
    const hideWhen = g.hideWhen;

    groups.push({
      id,
      label,
      priced: Boolean(g.priced),
      kind,
      ...(hideWhen ? { hideWhen } : {}),
      ...(g.quantityFrom ? { quantityFrom: g.quantityFrom } : {}),
      choices,
    });
  }

  if (new Set(groups.map((g) => g.id)).size !== groups.length) {
    return { error: "Two option groups share an id. Remove one and add it again." };
  }

  // hideWhen can only be checked once every group is known.
  for (const g of groups) {
    const rule = g.hideWhen;
    if (!rule) continue;

    const source = groups.find((x) => x.id === rule.groupId);
    if (!source) {
      return { error: `"${g.label}" hides on a group that no longer exists.` };
    }

    const valid = Array.isArray(rule.choiceIds)
      ? rule.choiceIds.filter((id) => source.choices.some((c) => c.id === id))
      : [];
    if (valid.length === 0) {
      return {
        error: `"${g.label}" is set to hide, but no choice was picked to trigger it.`,
      };
    }

    g.hideWhen = { groupId: source.id, choiceIds: valid };
  }

  // Same for quantityFrom: it names another group's choices, so it can only be
  // checked once every group is in hand. A device group without a usable rule
  // is dropped rather than left to reject every basket at checkout.
  for (const g of groups) {
    const rule = g.quantityFrom;
    if (!rule) continue;

    if (g.kind !== "multi") {
      delete g.quantityFrom;
      continue;
    }

    const driver = groups.find((x) => x.id === rule.groupId && x.id !== g.id);
    const perChoice: Record<string, number> = {};

    if (driver) {
      for (const c of driver.choices) {
        const n = Math.trunc(Number(rule.perChoice?.[c.id] ?? 0));
        perChoice[c.id] = Number.isFinite(n) && n > 0 ? n : 0;
      }
    }

    if (!driver || !Object.values(perChoice).some((n) => n > 0)) {
      delete g.quantityFrom;
      continue;
    }

    g.quantityFrom = { groupId: driver.id, perChoice };
  }

  const priced = groups.filter((g) => g.priced);
  if (priced.length === 0) {
    return { error: 'Tick "Sets the price" on at least one group.' };
  }

  const rawPrices = Array.isArray(data.prices) ? data.prices : [];
  const prices: PriceRule[] = [];

  let combos: Record<string, string>[] = [{}];
  for (const g of priced) {
    combos = combos.flatMap((row) =>
      g.choices.map((c) => ({ ...row, [g.id]: c.id })),
    );
  }

  for (const combo of combos) {
    const match = rawPrices.find((entry) => {
      const values = ((entry as Partial<PriceRule>).values ?? {}) as Record<
        string,
        string
      >;
      return priced.every((g) => values[g.id] === combo[g.id]);
    }) as Partial<PriceRule> | undefined;

    const price = Number(match?.price);
    if (!match || !Number.isFinite(price) || price < 0) {
      const described = priced
        .map(
          (g) =>
            `${g.label}: ${g.choices.find((c) => c.id === combo[g.id])?.label}`,
        )
        .join(", ");
      return { error: `Missing a price for ${described}.` };
    }

    prices.push({ values: combo, price: Math.round(price) });
  }

  return { groups, prices };
}

function parseProduct(fd: FormData): { product?: Product; error?: string } {
  const title = str(fd, "title");
  const slug = slugify(str(fd, "slug") || title);
  const category = str(fd, "category");
  const plans = parsePlans(fd);

  const options = parseOptions(str(fd, "options"));
  if (options.error) return { error: options.error };
  const advanced = Boolean(options.groups);

  const rawType = str(fd, "productType");
  const productType: ProductType =
    rawType === "netflix" || rawType === "prime" ? rawType : "generic";

  if (!title) return { error: "Title is required." };
  if (!slug) return { error: "Slug could not be generated — set one manually." };
  if (!categories.some((c) => c.slug === category)) {
    return { error: "Pick a valid category." };
  }

  if (productType !== "generic" && !advanced) {
    return {
      error:
        "Netflix and Prime products need the duration × screen prices filled in.",
    };
  }

  // A product is sold either through simple plans or through the option
  // matrix, never both.
  if (!advanced) {
    if (plans.length === 0) {
      return {
        error: "Add at least one plan with a name and a price of 0 or more.",
      };
    }
    if (new Set(plans.map((p) => p.id)).size !== plans.length) {
      return {
        error: "Two plans share the same ID. Give each plan a unique ID.",
      };
    }
  }

  return {
    product: {
      slug,
      title,
      category,
      tagline: str(fd, "tagline"),
      summary: str(fd, "summary"),
      badges: lines(str(fd, "badges")),
      warranty: str(fd, "warranty"),
      specs: str(fd, "specs")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
      plans: advanced ? [] : plans,
      ...(advanced
        ? { optionGroups: options.groups, prices: options.prices }
        : {}),
      productType,
      featured: fd.get("featured") === "on",
      comingSoon: fd.get("comingSoon") === "on",
    },
  };
}

export async function saveProductAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  if (!(await guard())) return { error: "Not signed in as an admin." };

  const { product, error } = parseProduct(fd);
  if (!product) return { error };

  const image = await readImageField(fd, "image");
  if (!image.ok && !image.empty) return { error: image.error };

  const removeImage = fd.get("removeImage") === "on";

  // Carry the current image across an edit that doesn't replace it.
  if (image.ok) product.imageContentType = image.contentType;
  else if (!removeImage) {
    const existing = str(fd, "currentImageType");
    if (existing) product.imageContentType = existing;
  }

  const originalSlug = str(fd, "originalSlug") || undefined;
  const renamed = originalSlug !== undefined && originalSlug !== product.slug;

  try {
    // Keyed on the original slug, so renaming updates the existing document
    // instead of leaving the old one behind.
    await upsertProduct(product, { originalSlug });

    if (image.ok) {
      await saveProductImage(product.slug, image.contentType, image.base64);
    } else if (removeImage) {
      await deleteProductImage(product.slug);
    } else if (renamed && originalSlug) {
      await renameProductImage(originalSlug, product.slug);
    }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not save the product.",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  redirect(`/admin/products?saved=${encodeURIComponent(product.slug)}`);
}

export async function deleteProductAction(fd: FormData) {
  if (!(await guard())) redirect("/login?next=/admin/products");

  const slug = String(fd.get("slug") ?? "");
  if (slug) await deleteProduct(slug);

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  redirect("/admin/products?deleted=1");
}

/* ---------------- session ---------------- */

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

/* ---------------- orders ---------------- */

export async function updateOrderStatusAction(fd: FormData) {
  if (!(await guard())) redirect("/login?next=/admin/orders");

  const reference = String(fd.get("reference") ?? "");
  const status = String(fd.get("status") ?? "") as OrderStatus;

  if (reference && orderStatuses.includes(status)) {
    await updateOrderStatus(reference, status);
  }

  revalidatePath("/admin/orders");
  redirect(`/admin/orders?updated=${encodeURIComponent(reference)}`);
}

/** Order references are generated as `TAS-XXXXX`; nothing else reaches Mongo. */
const REFERENCE = /^[A-Za-z0-9-]{4,32}$/;

/** Where the form was submitted from, so the admin lands back on that view. */
const returnTo = (fd: FormData, fallback: string) => {
  const back = str(fd, "back");
  return back.startsWith("/admin/") ? back : fallback;
};

const backTo = (path: string, key: string, value: string) =>
  `${path}?${key}=${encodeURIComponent(value)}`;

/**
 * Permanently deletes an order and its payment screenshot. Admin-only, and the
 * result comes from the database — a reference that does not exist reports an
 * error rather than a success.
 */
export async function deleteOrderAction(fd: FormData) {
  if (!(await guard())) redirect("/login?next=/admin/orders");

  const path = returnTo(fd, "/admin/orders");
  const reference = str(fd, "reference");

  if (!REFERENCE.test(reference)) {
    redirect(backTo(path, "error", "That order reference is not valid."));
  }

  let removed = false;
  try {
    removed = await deleteOrder(reference);
  } catch {
    removed = false;
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");

  redirect(
    removed
      ? backTo(path, "deleted", reference)
      : backTo(
          path,
          "error",
          `Order ${reference} was not found — it may already have been deleted.`,
        ),
  );
}

/* ---------------- customers ---------------- */

/**
 * Erases a customer's details from their orders. Kept as an overwrite rather
 * than a delete so the sales record and the payment screenshot survive.
 */
export async function deleteCustomerAction(fd: FormData) {
  if (!(await guard())) redirect("/login?next=/admin/customers");

  const path = returnTo(fd, "/admin/customers");
  const email = str(fd, "email").toLowerCase();

  if (!email) redirect(backTo(path, "error", "No customer was selected."));

  let touched = 0;
  try {
    touched = await anonymiseCustomer(email);
  } catch {
    touched = 0;
  }

  revalidatePath("/admin/customers");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");

  redirect(
    touched > 0
      ? backTo(path, "deleted", email)
      : backTo(path, "error", `No orders belong to ${email}.`),
  );
}

/* ---------------- fulfilment ---------------- */

/** Gmail accepts 25 MB; stay well under it and keep the panel responsive. */
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_TOTAL = 10 * 1024 * 1024;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Emails a customer their account details. Admin-only, and the order is only
 * marked fulfilled once the SMTP server has accepted the message — a failed
 * send reports the failure and leaves the order untouched, so "sent" always
 * means something was actually handed to Gmail.
 *
 * The password is not persisted anywhere. Resending means typing it again.
 */
export async function sendAccountDetailsAction(fd: FormData) {
  const admin = await currentAdmin();
  if (!admin) redirect("/login?next=/admin/orders");

  const path = returnTo(fd, "/admin/orders");
  const reference = str(fd, "reference").toUpperCase();

  if (!REFERENCE.test(reference)) {
    redirect(backTo(path, "error", "That order reference is not valid."));
  }

  const order = await getOrder(reference);
  if (!order) {
    redirect(backTo(path, "error", `Order ${reference} does not exist.`));
  }

  const to = str(fd, "to").toLowerCase();
  const username = str(fd, "username");
  const password = str(fd, "password");
  const duration = str(fd, "duration");
  const instructions = str(fd, "instructions");
  const notes = str(fd, "notes");

  if (!EMAIL_SHAPE.test(to)) {
    redirect(backTo(path, "error", "Enter a valid customer email address."));
  }
  if (!username) {
    redirect(backTo(path, "error", "The account username or email is required."));
  }

  const files = fd
    .getAll("attachments")
    .filter((v): v is File => v instanceof File && v.size > 0);

  if (files.length > MAX_ATTACHMENTS) {
    redirect(
      backTo(path, "error", `Attach at most ${MAX_ATTACHMENTS} images.`),
    );
  }

  const attachments: MailAttachment[] = [];
  let total = 0;

  for (const file of files) {
    if (!IMAGE_TYPES.includes(file.type)) {
      redirect(
        backTo(path, "error", `"${file.name}" is not a JPEG, PNG, WebP, AVIF or GIF.`),
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      redirect(backTo(path, "error", `"${file.name}" is larger than 4 MB.`));
    }

    total += file.size;
    if (total > MAX_ATTACHMENT_TOTAL) {
      redirect(
        backTo(path, "error", "The attachments total more than 10 MB. Send fewer or smaller images."),
      );
    }

    attachments.push({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });
  }

  const { html, subject } = fulfillmentEmail({
    reference: order.reference,
    customerName: order.customer.name,
    items: order.items.map((i) => ({
      title: i.title,
      planName: i.planName,
      meta: i.meta,
      qty: i.qty,
    })),
    username,
    ...(password ? { password } : {}),
    ...(duration ? { duration } : {}),
    instructions,
    ...(notes ? { notes } : {}),
    attachmentCount: attachments.length,
  });

  const result = await sendMail({ to, subject, html, attachments });

  if (!result.ok) {
    revalidatePath("/admin/orders");
    redirect(backTo(path, "error", result.error));
  }

  try {
    await markFulfilled(order.reference, {
      sentTo: to,
      sentBy: admin.email ?? "unknown",
      channel: "email",
      messageId: result.messageId,
    });
  } catch {
    // The message is already with Gmail. Losing the bookkeeping record is not
    // worth telling the admin the send failed, but it is worth saying plainly.
    revalidatePath("/admin/orders");
    redirect(
      backTo(
        path,
        "sent",
        `${reference} (email accepted, but the sent record could not be saved)`,
      ),
    );
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect(backTo(path, "sent", reference));
}

/**
 * Records that the admin sent the details over WhatsApp themselves. Opening a
 * chat window proves nothing, so this only runs when the admin says they have
 * actually sent the message — and it never sends anything by itself.
 */
export async function markWhatsAppSentAction(fd: FormData) {
  const admin = await currentAdmin();
  if (!admin) redirect("/login?next=/admin/orders");

  const path = returnTo(fd, "/admin/orders");
  const reference = str(fd, "reference").toUpperCase();

  if (!REFERENCE.test(reference)) {
    redirect(backTo(path, "error", "That order reference is not valid."));
  }

  const order = await getOrder(reference);
  if (!order) {
    redirect(backTo(path, "error", `Order ${reference} does not exist.`));
  }

  try {
    await markFulfilled(reference, {
      // The number the customer gave, not the store's own line.
      sentTo: order.customer.phone,
      sentBy: admin.email ?? "unknown",
      channel: "whatsapp",
    });
  } catch {
    revalidatePath("/admin/orders");
    redirect(backTo(path, "error", "Could not record the delivery. Try again."));
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect(backTo(path, "whatsapp", reference));
}

/* ---------------- staff accounts ---------------- */
/**
 * Removes a sign-in account. Two cases are refused outright: the account the
 * admin is signed in with, and the last remaining administrator — either would
 * lock everyone out of this panel.
 */
export async function deleteStaffAction(fd: FormData) {
  const admin = await currentAdmin();
  if (!admin) redirect("/login?next=/admin/customers");

  const path = returnTo(fd, "/admin/customers");
  const email = str(fd, "email").toLowerCase();

  if (!email) redirect(backTo(path, "error", "No account was selected."));
  if (email === admin.email?.toLowerCase()) {
    redirect(
      backTo(path, "error", "You cannot delete the account you are signed in with."),
    );
  }

  const target = await findUserByEmail(email);
  if (!target) {
    redirect(backTo(path, "error", `${email} does not exist.`));
  }
  if (target.role === "admin" && (await countAdmins()) <= 1) {
    redirect(
      backTo(path, "error", "That is the last administrator — the panel would be unreachable."),
    );
  }

  let removed = false;
  try {
    removed = await deleteUser(email);
  } catch {
    removed = false;
  }

  revalidatePath("/admin/customers");
  revalidatePath("/admin");

  redirect(
    removed
      ? backTo(path, "deleted", email)
      : backTo(path, "error", `Could not delete ${email}.`),
  );
}

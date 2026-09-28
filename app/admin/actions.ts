"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAdmin, signOut } from "@/auth";
import { categories, slugify, type OptionChoice, type OptionGroup, type Plan, type PriceRule, type Product } from "@/lib/products";
import {
  deleteProduct,
  deleteProductImage,
  orderStatuses,
  renameProductImage,
  saveProductImage,
  updateOrderStatus,
  upsertProduct,
  type OrderStatus,
} from "@/lib/repo";

import { readImageField } from "@/lib/uploads";

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
      const count =
        typeof c.count === "number" && c.count > 0
          ? Math.floor(c.count)
          : undefined;
      choices.push({ id: cid, label: clabel, ...(count ? { count } : {}) });
    }
    if (choices.length === 0) {
      return { error: `"${label}" needs at least one choice.` };
    }

    const kind = g.kind === "slots" ? "slots" : "select";
    const slotsFrom =
      kind === "slots" ? String(g.slotsFrom ?? "").trim() : "";
    if (kind === "slots" && !slotsFrom) {
      return {
        error: `"${label}" needs a group to take its number of slots from.`,
      };
    }

    groups.push({
      id,
      label,
      priced: Boolean(g.priced),
      multiplies: Boolean(g.multiplies),
      kind,
      ...(slotsFrom ? { slotsFrom } : {}),
      choices,
    });
  }

  if (new Set(groups.map((g) => g.id)).size !== groups.length) {
    return { error: "Two option groups share an id. Remove one and add it again." };
  }

  const slotGroup = groups.find((g) => g.kind === "slots");
  if (slotGroup?.slotsFrom && !groups.some((g) => g.id === slotGroup.slotsFrom)) {
    return {
      error: `"${slotGroup.label}" points at a group that no longer exists.`,
    };
  }

  const priced = groups.filter((g) => g.priced);
  if (priced.length === 0) {
    return { error: 'Tick "Sets the price" on at least one group.' };
  }

  // A multiplier with no unit count multiplies by 1, which silently does
  // nothing — reject it instead.
  for (const g of groups.filter((x) => x.multiplies)) {
    if (g.choices.some((c) => !c.count || c.count < 1)) {
      return {
        error: `Every choice in "${g.label}" needs a number of units (months).`,
      };
    }
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

  if (!title) return { error: "Title is required." };
  if (!slug) return { error: "Slug could not be generated — set one manually." };
  if (!categories.some((c) => c.slug === category)) {
    return { error: "Pick a valid category." };
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

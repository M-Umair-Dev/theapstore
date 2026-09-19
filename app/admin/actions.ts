"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAdmin, signOut } from "@/auth";
import { categories, slugify, type Plan, type Product } from "@/lib/products";
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

export type ActionState = { error?: string; ok?: string };

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

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

function parseProduct(fd: FormData): { product?: Product; error?: string } {
  const title = str(fd, "title");
  const slug = slugify(str(fd, "slug") || title);
  const category = str(fd, "category");
  const plans = parsePlans(fd);

  if (!title) return { error: "Title is required." };
  if (!slug) return { error: "Slug could not be generated — set one manually." };
  if (!categories.some((c) => c.slug === category)) {
    return { error: "Pick a valid category." };
  }
  if (plans.length === 0) {
    return {
      error: "Add at least one plan with a name and a price of 0 or more.",
    };
  }
  if (new Set(plans.map((p) => p.id)).size !== plans.length) {
    return { error: "Two plans share the same ID. Give each plan a unique ID." };
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
      plans,
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

  const image = fd.get("image");
  const uploaded = image instanceof File && image.size > 0;
  const removeImage = fd.get("removeImage") === "on";

  if (uploaded && image instanceof File) {
    if (!IMAGE_TYPES.includes(image.type)) {
      return { error: "Images must be JPEG, PNG, WebP, AVIF or GIF." };
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return { error: "That image is larger than 4 MB. Resize it and retry." };
    }
  }

  // Carry the current image across an edit that doesn't replace it.
  if (uploaded) product.imageContentType = (image as File).type;
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

    if (uploaded && image instanceof File) {
      const bytes = Buffer.from(await image.arrayBuffer());
      await saveProductImage(product.slug, image.type, bytes.toString("base64"));
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

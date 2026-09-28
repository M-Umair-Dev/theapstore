"use server";

import {
  createOrder,
  getProductBySlug,
  saveOrderReceipt,
  type OrderItem,
} from "@/lib/repo";
import {
  describeSelection,
  hasOptions,
  isComplete,
  parseSelectionId,
  priceFor,
} from "@/lib/options";
import { readImageField } from "@/lib/uploads";

export type OrderState = { error?: string; reference?: string };

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

type IncomingLine = { slug?: unknown; planId?: unknown; qty?: unknown };

/**
 * Re-prices every line against the database. The cart lives in the browser, so
 * its prices are untrusted — only the slug, plan id and quantity are read from
 * it, and the price comes from the catalogue.
 */
async function priceCart(raw: string): Promise<OrderItem[] | string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    return "The cart could not be read. Reload the page and try again.";
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return "Your cart is empty.";
  if (parsed.length > 50) return "Too many items in one order.";

  const items: OrderItem[] = [];
  for (const line of parsed as IncomingLine[]) {
    const slug = typeof line.slug === "string" ? line.slug : "";
    const planId = typeof line.planId === "string" ? line.planId : "";
    const qty = Number(line.qty);

    if (!slug || !planId) return "An item in your cart is malformed.";
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      return "Quantities must be whole numbers between 1 and 20.";
    }

    const product = await getProductBySlug(slug);
    if (!product) return `"${slug}" is no longer in the store. Remove it and try again.`;
    if (product.comingSoon) return `"${product.title}" is not available yet.`;

    if (hasOptions(product)) {
      // Option products carry their whole selection in the line id; the price
      // is recomputed here from the catalogue, never taken from the browser.
      const selection = parseSelectionId(planId);
      if (!isComplete(product, selection)) {
        return `Your options for "${product.title}" are incomplete. Open the product and pick again.`;
      }

      const price = priceFor(product, selection);
      if (price <= 0) {
        return `That combination for "${product.title}" is no longer available. Pick another.`;
      }

      const { planName, meta } = describeSelection(product, selection);
      items.push({
        slug: product.slug,
        title: product.title,
        planId,
        planName,
        meta,
        price,
        qty,
      });
      continue;
    }

    const plan = product.plans.find((p) => p.id === planId);
    if (!plan) return `That plan for "${product.title}" is no longer available.`;

    items.push({
      slug: product.slug,
      title: product.title,
      planId: plan.id,
      planName: plan.name,
      meta: plan.meta.join(" • "),
      price: plan.price,
      qty,
    });
  }
  return items;
}

export async function placeOrderAction(
  _prev: OrderState,
  fd: FormData,
): Promise<OrderState> {
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const phone = str(fd, "phone");
  const paymentMethod = str(fd, "method");
  const notes = str(fd, "notes");

  if (name.length < 2) return { error: "Enter your full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (phone.replace(/\D/g, "").length < 9) {
    return { error: "Enter a valid phone number." };
  }
  if (!["Bank transfer", "Easypaisa", "JazzCash"].includes(paymentMethod)) {
    return { error: "Choose a payment method." };
  }

  const priced = await priceCart(str(fd, "cart"));
  if (typeof priced === "string") return { error: priced };

  // Validate the screenshot before creating anything, so a bad upload doesn't
  // leave a half-finished order behind.
  const receipt = await readImageField(fd, "receipt");
  if (!receipt.ok && !receipt.empty) return { error: receipt.error };

  const total = priced.reduce((sum, i) => sum + i.price * i.qty, 0);

  let reference: string;
  try {
    reference = await createOrder({
      customer: { name, email, phone },
      items: priced,
      total,
      paymentMethod,
      ...(notes ? { notes } : {}),
    });
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? `Could not place the order: ${e.message}`
          : "Could not place the order.",
    };
  }

  if (receipt.ok) {
    try {
      await saveOrderReceipt(reference, receipt.contentType, receipt.base64);
    } catch (e) {
      // The order exists and the confirmation tells the customer to send the
      // screenshot on WhatsApp anyway, so don't fail the whole checkout here.
      console.error(`Receipt upload failed for ${reference}:`, e);
    }
  }

  return { reference };
}

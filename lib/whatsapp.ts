import { site } from "./site";
import type { Product, Plan } from "./products";

export const waEnabled = site.whatsapp.length > 0;

/** Returns null when no WhatsApp number is configured, so callers can hide the action. */
export function waLink(message: string): string | null {
  if (!waEnabled) return null;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function orderMessage({
  product,
  plan,
}: {
  product: Product;
  plan: Plan;
}): string {
  return [
    `Hello ${site.name}, I would like to order:`,
    "",
    `Product: ${product.title}`,
    `Plan: ${plan.name}`,
    `Details: ${plan.meta.join(", ")}`,
    `Price: Rs. ${plan.price.toLocaleString("en-US")}`,
    `Product ID: ${plan.id}`,
  ].join("\n");
}

/** Whole-cart message, used by the cart and order pages. */
export function cartMessage(
  lines: { title: string; planName: string; meta: string; price: number; qty: number }[],
  total: number,
): string {
  const body = lines.map(
    (l) =>
      `• ${l.title} — ${l.planName} (${l.meta}) × ${l.qty} = Rs. ${(
        l.price * l.qty
      ).toLocaleString("en-US")}`,
  );

  return [
    `Hello ${site.name}, I would like to order:`,
    "",
    ...body,
    "",
    `Total: Rs. ${total.toLocaleString("en-US")}`,
  ].join("\n");
}

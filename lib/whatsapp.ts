import { site } from "./site";

export const waEnabled = site.whatsapp.length > 0;

/** Returns null when no WhatsApp number is configured, so callers can hide the action. */
export function waLink(message: string): string | null {
  if (!waEnabled) return null;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Whole-cart message, used by cards, the product page, the cart and checkout. */
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

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

/* ---------------- order follow-up ---------------- */

export type OrderFollowUp = {
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryMethod?: string;
  items: { title: string; planName: string; meta?: string; qty: number }[];
  total: number;
  placedAt: Date;
};

/**
 * The message behind the follow-up button on the confirmation screen.
 *
 * Built from the order that was just placed, in the same request that created
 * it — never from the cart, which is empty by the time that screen renders, and
 * never from a lookup that could return someone else's order.
 *
 * No credentials, tokens or payment-proof links: a WhatsApp chat is not a
 * private channel and this message only states what the customer already typed.
 */
export function orderFollowUpMessage(d: OrderFollowUp): string {
  const when = new Date(d.placedAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Karachi",
  });

  const items = d.items.map((i) =>
    [
      `• ${i.title} × ${i.qty}`,
      i.planName && `   ${i.planName}`,
      i.meta && `   ${i.meta}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `Hello, ${site.name}!`,
    "",
    "I would like to follow up on my order.",
    "",
    `Order ID: ${d.reference}`,
    `Customer Name: ${d.customerName}`,
    `Email: ${d.customerEmail}`,
    d.customerPhone && `Phone: ${d.customerPhone}`,
    `Payment Method: ${d.paymentMethod}`,
    `Payment Status: ${d.paymentStatus}`,
    d.deliveryMethod && `Delivery Method: ${d.deliveryMethod}`,
    "",
    "Order Items:",
    ...items,
    "",
    `Order Total: Rs. ${d.total.toLocaleString("en-US")}`,
    `Order Date: ${when}`,
    "",
    "Could you please provide an update on my order?",
    "",
    "Thank you.",
  ]
    .filter((line): line is string => typeof line === "string")
    .join("\n");
}

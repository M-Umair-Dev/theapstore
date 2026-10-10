/**
 * Builds the WhatsApp hand-off for an order's account details.
 *
 * Pure and client-safe: the admin form calls this in the browser when the send
 * button is pressed, so the message always reflects what is on screen right
 * now. Nothing here reads the database.
 */

export type FulfillmentMessageInput = {
  customerName: string;
  reference: string;
  items: { title: string; planName: string; meta: string }[];
  username: string;
  password?: string;
  duration?: string;
  expiry?: string;
  instructions?: string;
  notes?: string;
  storeName: string;
  contactEmail: string;
};

/**
 * wa.me wants digits only, with the country code and no leading zero. Numbers
 * already written internationally are left alone — the only rewrite is a
 * local `0…` number, which needs the store's own country code to become
 * dialable. Nothing is guessed: an unrecognised shape is reported, not sent.
 */
export function normalizeWhatsAppNumber(
  raw: string,
  countryCode: string,
): { ok: true; number: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "This order has no phone number saved." };
  }

  const digits = trimmed.replace(/\D/g, "");

  // 00-prefixed international form, e.g. 0092 340…
  const withoutExit = digits.startsWith("00") ? digits.slice(2) : digits;

  if (withoutExit.startsWith(countryCode) && withoutExit.length >= 11) {
    return { ok: true, number: withoutExit };
  }

  // Local form: 0340 4000618 → 923404000618
  if (withoutExit.startsWith("0") && withoutExit.length === 11) {
    return { ok: true, number: `${countryCode}${withoutExit.slice(1)}` };
  }

  if (withoutExit.length >= 10 && withoutExit.length <= 15) {
    return { ok: true, number: withoutExit };
  }

  return {
    ok: false,
    error: `"${trimmed}" is not a usable WhatsApp number. Save it with the country code, for example ${countryCode}3404000618.`,
  };
}

/**
 * The prefilled chat text. Empty fields are dropped rather than printed as
 * blanks, so an order with no password does not show an empty Password line.
 */
export function buildWhatsAppMessage(d: FulfillmentMessageInput) {
  const products = d.items
    .map((i) =>
      [
        `Product: ${i.title}`,
        i.planName && `Subscription/Variation: ${i.planName}`,
        i.meta && `Includes: ${i.meta}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  const account = [
    d.username && `Username/Email: ${d.username}`,
    d.password && `Password: ${d.password}`,
  ]
    .filter(Boolean)
    .join("\n");

  const subscription = [
    d.duration && `Duration: ${d.duration}`,
    d.expiry && `Expiry Date: ${d.expiry}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    `Hello ${d.customerName},`,
    "",
    "Your order is ready!",
    "",
    `Order ID: ${d.reference}`,
    products,
    subscription,
    "",
    account ? `ACCOUNT DETAILS\n\n${account}` : "",
    d.instructions ? `LOGIN INSTRUCTIONS\n\n${d.instructions}` : "",
    d.notes ? `ADDITIONAL INFORMATION\n\n${d.notes}` : "",
    "If you need assistance with login or usage, please contact our support team on WhatsApp.",
    "",
    `Thank you for shopping with ${d.storeName}!`,
    d.contactEmail,
  ]
    .filter((line, i, all) => !(line === "" && (i === 0 || all[i - 1] === "")))
    .join("\n")
    .trim();
}

/** The wa.me URL. Only the message carries credentials — never a query param. */
export const whatsappHref = (number: string, message: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

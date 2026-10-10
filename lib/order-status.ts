/**
 * Order statuses live in their own module so client components can import the
 * type without pulling in the database driver.
 */

export type OrderStatus = "pending" | "verified" | "delivered" | "cancelled";

export const orderStatuses: OrderStatus[] = [
  "pending",
  "verified",
  "delivered",
  "cancelled",
];

/** Only these count toward revenue. */
export const earningStatuses: OrderStatus[] = ["verified", "delivered"];

/* ---------------- delivery ---------------- */

/**
 * How the customer asked to receive their account details. Chosen at checkout,
 * separate from payment status and from order status.
 */
export type DeliveryMethod = "whatsapp" | "email";

export const deliveryMethods: DeliveryMethod[] = ["whatsapp", "email"];

export const deliveryLabels: Record<DeliveryMethod, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
};

export const isDeliveryMethod = (v: unknown): v is DeliveryMethod =>
  v === "whatsapp" || v === "email";

/** Orders placed before this choice existed carry no method. */
export const deliveryLabel = (v: DeliveryMethod | undefined) =>
  v ? deliveryLabels[v] : "Not specified";

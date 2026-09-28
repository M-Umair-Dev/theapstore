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

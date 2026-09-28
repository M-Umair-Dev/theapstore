"use server";

import { findOrderForTracking, type OrderItem, type OrderStatus } from "@/lib/repo";

export type TrackResult = {
  error?: string;
  order?: {
    reference: string;
    status: OrderStatus;
    /** ISO string so the result can cross to the client component. */
    createdAt: string;
    items: OrderItem[];
    total: number;
    paymentMethod: string;
  };
};

export async function trackOrderAction(
  _prev: TrackResult,
  fd: FormData,
): Promise<TrackResult> {
  const reference = String(fd.get("reference") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();

  if (!reference || !email) {
    return {
      error: "Enter both your order reference and the email you ordered with.",
    };
  }

  const order = await findOrderForTracking(reference, email);

  // Deliberately one message for both failure modes — saying "that reference
  // exists but the email is wrong" would confirm other people's order numbers.
  if (!order) {
    return {
      error:
        "No order matches that reference and email. Check both and try again.",
    };
  }

  return {
    order: {
      reference: order.reference,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      items: order.items,
      total: order.total,
      paymentMethod: order.paymentMethod,
    },
  };
}

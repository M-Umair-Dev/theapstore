"use client";

import Link from "next/link";
import { useActionState } from "react";
import { trackOrderAction, type TrackResult } from "./actions";
import { formatPrice } from "@/lib/products";
import type { OrderStatus } from "@/lib/order-status";

const initial: TrackResult = {};

const STATUS_COPY: Record<OrderStatus, { label: string; detail: string }> = {
  pending: {
    label: "Payment under review",
    detail:
      "We have your order and are checking the payment screenshot. This usually takes under an hour during business hours.",
  },
  verified: {
    label: "Payment confirmed",
    detail:
      "We have confirmed your payment and are preparing your access details.",
  },
  delivered: {
    label: "Delivered",
    detail:
      "Your access details have been sent to the email you ordered with. Check your spam folder if you can't find them.",
  },
  cancelled: {
    label: "Cancelled",
    detail:
      "This order was cancelled. If that is unexpected, contact us with your reference.",
  },
};

export default function TrackForm({
  initialReference = "",
}: {
  initialReference?: string;
}) {
  const [state, action, pending] = useActionState(trackOrderAction, initial);

  return (
    <>
      <form action={action} className="track-form">
        <div className="form-grid">
          <div className="field">
            <label className="label" htmlFor="reference">
              Order reference
            </label>
            <input
              id="reference"
              name="reference"
              className="input"
              defaultValue={initialReference}
              placeholder="TAS-4F2K9"
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="email">
              Email you ordered with
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              required
            />
          </div>
        </div>

        {state.error && (
          <p className="form-error" style={{ marginTop: "var(--space-5)" }} role="alert">
            {state.error}
          </p>
        )}

        <div style={{ marginTop: "var(--space-6)" }}>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Looking up…" : "Track order"}
          </button>
        </div>
      </form>

      {state.order && (
        <div className="summary-card" style={{ marginTop: "var(--space-7)" }}>
          <div className="summary-row">
            <span>Reference</span>
            <strong>{state.order.reference}</strong>
          </div>
          <div className="summary-row">
            <span>Placed</span>
            <span>
              {new Date(state.order.createdAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="summary-row">
            <span>Status</span>
            <span
              className={`pill${
                state.order.status === "pending"
                  ? ""
                  : state.order.status === "cancelled"
                    ? " pill-off"
                    : " pill-ok"
              }`}
            >
              {STATUS_COPY[state.order.status].label}
            </span>
          </div>

          <h2 style={{ fontSize: 16, marginTop: "var(--space-6)" }}>Items</h2>
          {state.order.items.map((item) => (
            <div className="summary-row" key={`${item.slug}-${item.planId}`}>
              <span>
                {item.title}
                <br />
                <span className="cart-meta">
                  {item.planName} × {item.qty}
                </span>
              </span>
              <strong>{formatPrice(item.price * item.qty)}</strong>
            </div>
          ))}

          <div className="summary-total">
            <span>Total</span>
            <strong>{formatPrice(state.order.total)}</strong>
          </div>

          <p className="helper-text">
            {STATUS_COPY[state.order.status].detail}
          </p>

          <p className="helper-text">
            Something wrong with this order?{" "}
            <Link href="/contact">Contact us</Link> with the reference above.
          </p>
        </div>
      )}
    </>
  );
}

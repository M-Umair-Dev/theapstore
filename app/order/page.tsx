"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { placeOrderAction, type OrderState } from "@/app/order/actions";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { site } from "@/lib/site";
import { cartMessage, waLink } from "@/lib/whatsapp";

const initial: OrderState = {};

export default function OrderPage() {
  const { lines, ready, clear } = useCart();
  const [state, action, pending] = useActionState(placeOrderAction, initial);
  const cleared = useRef(false);

  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const whatsapp = waLink(cartMessage(lines, total));

  // Empty the cart once, after the order has a reference.
  useEffect(() => {
    if (state.reference && !cleared.current) {
      cleared.current = true;
      clear();
    }
  }, [state.reference, clear]);

  if (!ready) return <div className="container" />;

  if (state.reference) {
    return (
      <div className="container" style={{ paddingBlock: "var(--space-8)" }}>
        <div className="empty-state">
          <h2>Order received</h2>
          <p>
            Your reference is <strong>{state.reference}</strong>. We verify your
            payment and send your access details to the email you gave us. Keep
            the reference for any warranty claim.
          </p>
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <Link href="/shop" className="btn btn-primary">
              Continue shopping
            </Link>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                Chase it on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container" style={{ paddingBlock: "var(--space-8)" }}>
        <div className="empty-state">
          <h2>Nothing to order yet</h2>
          <p>Your cart is empty. Add a plan and it will show up here.</p>
          <Link href="/shop" className="btn btn-primary">
            Browse the shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container" style={{ paddingTop: "var(--space-6)" }}>
        <h1 className="section-title">Place your order</h1>
        <p className="section-lead">
          Fastest route is WhatsApp — one tap sends us your whole cart. Or fill
          the form in and we will verify your payment from here.
        </p>
      </div>

      <div className="container cart-layout">
        <div>
          {whatsapp && (
            <div className="value-card" style={{ marginBottom: "var(--space-6)" }}>
              <h2 style={{ fontSize: 18 }}>Order on WhatsApp</h2>
              <p className="hint" style={{ marginBottom: "var(--space-4)" }}>
                Sends your cart, plans and total to {site.whatsappDisplay} so we
                can confirm stock and payment with you directly.
              </p>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
              >
                <WhatsAppIcon />
                Send cart on WhatsApp
              </a>
            </div>
          )}

          <form id="order-form" action={action}>
            <input
              type="hidden"
              name="cart"
              value={JSON.stringify(
                lines.map((l) => ({
                  slug: l.slug,
                  planId: l.planId,
                  qty: l.qty,
                })),
              )}
            />

            <div className="form-grid">
              <div className="field">
                <label className="label" htmlFor="name">
                  Full name
                </label>
                <input id="name" name="name" className="input" required />
              </div>

              <div className="field">
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  required
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="phone">
                  Phone / WhatsApp number
                </label>
                <input id="phone" name="phone" className="input" required />
              </div>

              <div className="field">
                <label className="label" htmlFor="method">
                  Payment method
                </label>
                <select id="method" name="method" className="select" required>
                  <option value="">Choose a method</option>
                  <option>Bank transfer</option>
                  <option>Easypaisa</option>
                  <option>JazzCash</option>
                </select>
              </div>

              <div className="field field-full">
                <label className="label" htmlFor="notes">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  className="textarea"
                  placeholder="Anything we should know about your order. Mention your transaction ID here."
                />
                <span className="hint">
                  Send the payment screenshot on WhatsApp to{" "}
                  {site.whatsappDisplay}, or email it to {site.email} quoting
                  your reference.
                </span>
              </div>
            </div>

            {state.error && (
              <p className="form-error" style={{ marginTop: "var(--space-5)" }} role="alert">
                {state.error}
              </p>
            )}

            <div style={{ marginTop: "var(--space-7)" }}>
              <h2 className="block-title" style={{ marginTop: 0 }}>
                What happens next
              </h2>
              <ul className="spec-list">
                <li>We verify your payment against the proof you send.</li>
                <li>
                  Your access details arrive by email, usually within the hour
                  during business hours.
                </li>
                <li>
                  Every plan keeps its warranty for the period shown on the
                  product page.
                </li>
              </ul>
            </div>
          </form>
        </div>

        <aside className="summary-card">
          <h2 style={{ fontSize: 16, marginBottom: "var(--space-3)" }}>
            Order summary
          </h2>

          {lines.map((item) => (
            <div
              className="summary-row"
              key={`${item.slug}-${item.planId}`}
            >
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
            <strong>{formatPrice(total)}</strong>
          </div>

          <button
            type="submit"
            form="order-form"
            className="btn btn-primary btn-block"
            disabled={pending}
          >
            {pending ? "Placing order…" : "Confirm Order"}
          </button>

          <p className="helper-text">
            By confirming you agree to the{" "}
            <Link href="/terms">terms</Link> and the{" "}
            <Link href="/refund-policy">refund policy</Link>.
          </p>
        </aside>
      </div>
    </>
  );
}

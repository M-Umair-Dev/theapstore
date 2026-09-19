"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { cartMessage, waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/WhatsAppIcon";

export default function CartPage() {
  const { lines, ready, setQty, remove } = useCart();
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const whatsapp = waLink(cartMessage(lines, total));

  return (
    <>
      <div className="container" style={{ paddingTop: "var(--space-6)" }}>
        <h1 className="section-title">Your cart</h1>
        <p className="section-lead">
          Review your products and plans, then complete them together in one
          order.
        </p>
      </div>

      <div className="container cart-layout">
        {!ready ? null : lines.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
            <h2>Your cart is empty</h2>
            <p>
              Nothing here yet. Pick a plan from the shop and it will appear in
              this list.
            </p>
            <Link href="/shop" className="btn btn-primary">
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            <div>
              {lines.map((item) => (
                <div
                  className="cart-line"
                  key={`${item.slug}-${item.planId}`}
                >
                  <div className="cart-thumb" aria-hidden="true">
                    {item.title.charAt(0)}
                  </div>

                  <div>
                    <Link
                      href={`/product/${item.slug}`}
                      className="cart-title"
                    >
                      {item.title}
                    </Link>
                    <p className="cart-meta">
                      {item.planName} • {item.meta}
                    </p>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => remove(item.slug, item.planId)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="qty">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        setQty(item.slug, item.planId, item.qty - 1)
                      }
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() =>
                        setQty(item.slug, item.planId, item.qty + 1)
                      }
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-subtotal">
                    {formatPrice(item.price * item.qty)}
                  </div>
                </div>
              ))}
            </div>

            <aside className="summary-card">
              <div className="summary-row">
                <span>Items</span>
                <strong>{lines.reduce((n, l) => n + l.qty, 0)}</strong>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span>Digital, by email</span>
              </div>

              <div className="summary-total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              <div className="summary-actions">
                {whatsapp && (
                  <a
                    className="btn btn-whatsapp btn-block"
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon />
                    Buy on WhatsApp
                  </a>
                )}
                <Link href="/order" className="btn btn-primary btn-block">
                  Proceed to Order
                </Link>
                <Link href="/shop" className="btn btn-secondary btn-block">
                  Continue shopping
                </Link>
              </div>

              <p className="helper-text">
                Nothing is charged until you confirm. Prices are re-checked
                against the catalogue when the order is placed.
              </p>
            </aside>
          </>
        )}
      </div>
    </>
  );
}

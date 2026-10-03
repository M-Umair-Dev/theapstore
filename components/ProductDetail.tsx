"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useCart } from "@/lib/cart";
import {
  countsOf,
  defaultSelection,
  describeSelection,
  hasOptions,
  isComplete,
  isHidden,
  lineFor,
  priceFor,
  requiredQuantity,
  totalCount,
  visibleGroups,
} from "@/lib/options";
import {
  formatPrice,
  getCategoryName,
  type Product,
  type Selection,
} from "@/lib/products";
import { cartMessage, waLink } from "@/lib/whatsapp";

export default function ProductDetail({
  product,
  isAdmin = false,
  children,
}: {
  product: Product;
  isAdmin?: boolean;
  children?: React.ReactNode;
}) {
  const { add } = useCart();
  const router = useRouter();
  const advanced = hasOptions(product);

  const [planId, setPlanId] = useState(product.plans[0]?.id ?? "");
  const [selection, setSelection] = useState<Selection>(() => {
    if (!advanced) return {};
    const seed = defaultSelection(product);
    // Device counts start empty so the customer allocates them deliberately
    // instead of inheriting whatever the cheapest combination happened to be.
    for (const g of product.optionGroups ?? []) {
      if (g.quantityFrom) seed[g.id] = [];
    }
    return seed;
  });
  const [added, setAdded] = useState(false);

  const soldOut = product.comingSoon;

  /* ---- simple products ---- */
  const plan = product.plans.find((p) => p.id === planId) ?? product.plans[0];

  /* ---- option products ---- */
  const complete = !advanced || isComplete(product, selection);
  const split = advanced ? describeSelection(product, selection) : null;
  const shown = advanced ? visibleGroups(product, selection) : [];

  const line = advanced
    ? lineFor(product, selection)
    : {
        slug: product.slug,
        planId: plan.id,
        title: product.title,
        planName: plan.name,
        meta: plan.meta.join(" • "),
        price: plan.price,
      };

  const price = advanced ? priceFor(product, selection) : plan.price;
  const whatsapp = waLink(cartMessage([{ ...line, qty: 1 }], price));

  /** Picks one value, then drops any group its hideWhen rule just hid. A new
   *  screen package also resets the device allocation, because the number of
   *  devices it needs has changed under the customer. */
  function pick(groupId: string, choiceId: string) {
    setAdded(false);
    setSelection((prev) => {
      const next: Selection = { ...prev, [groupId]: [choiceId] };
      for (const g of product.optionGroups ?? []) {
        if (isHidden(product, next, g) || g.quantityFrom?.groupId === groupId) {
          next[g.id] = [];
        }
      }
      return next;
    });
  }

  /** Ticks or unticks a choice in a plain multi-select group. */
  function toggle(groupId: string, choiceId: string) {
    setAdded(false);
    setSelection((prev) => {
      const current = prev[groupId] ?? [];
      return {
        ...prev,
        [groupId]: current.includes(choiceId)
          ? current.filter((id) => id !== choiceId)
          : [...current, choiceId],
      };
    });
  }

  /** Adds or removes one device allocation. Refuses to go past the screen
   *  count, so an invalid total is unreachable rather than merely rejected. */
  function bump(group: (typeof shown)[number], choiceId: string, delta: number) {
    setAdded(false);
    setSelection((prev) => {
      const current = prev[group.id] ?? [];
      const need = requiredQuantity(product, prev, group) ?? 0;

      if (delta > 0 && totalCount(countsOf(group, current)) >= need) return prev;
      if (delta < 0 && !current.includes(choiceId)) return prev;

      // Removing drops the last copy, so the order of the rest is preserved.
      const at = current.lastIndexOf(choiceId);
      const next =
        delta > 0
          ? [...current, choiceId]
          : [...current.slice(0, at), ...current.slice(at + 1)];

      return { ...prev, [group.id]: next };
    });
  }

  /** The first section the customer still has to answer. */
  const pending = shown.find((g) => {
    const picked = (selection[g.id] ?? []).filter(Boolean);
    if (g.quantityFrom) {
      return (
        totalCount(countsOf(g, picked)) !==
        (requiredQuantity(product, selection, g) ?? 0)
      );
    }
    return g.kind === "multi" ? picked.length < 1 : picked.length !== 1;
  });

  const pendingNote = pending?.quantityFrom
    ? `Please select devices for all ${requiredQuantity(product, selection, pending) ?? 0} screen${
        (requiredQuantity(product, selection, pending) ?? 0) === 1 ? "" : "s"
      }.`
    : pending
      ? `Choose an option in ${pending.label}.`
      : "";

  return (
    <div className="container pd-layout">
      <div>
        <div
          className="pd-media"
          aria-hidden={product.imageContentType ? undefined : true}
        >
          {product.imageContentType ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/image/${product.slug}`} alt={product.title} />
          ) : (
            product.title.charAt(0)
          )}
        </div>

        <div className="pd-head">
          <span className="badge badge-primary">
            {getCategoryName(product.category)}
          </span>
          <span className="badge badge-outline">{product.warranty}</span>
          {isAdmin && (
            <Link
              href={`/admin/products/${product.slug}`}
              className="btn btn-dark btn-sm"
              style={{ marginLeft: "auto" }}
            >
              Edit product
            </Link>
          )}
        </div>

        <h1 className="pd-title">{product.title}</h1>
        <p className="pd-summary">{product.summary}</p>

        <div className="pd-price-row">
          <span className="pd-price">
            {complete ? formatPrice(price) : "Choose your options"}
          </span>
          <span className="in-stock">
            {soldOut ? "Coming soon" : "In stock"}
          </span>
        </div>

        {advanced ? (
          <div id="plans">
            {shown.map((g) => (
              <section key={g.id}>
                <h2 className="block-title">{g.label}</h2>

                {g.kind === "multi" ? (
                  g.quantityFrom ? (
                    (() => {
                      const need = requiredQuantity(product, selection, g) ?? 0;
                      const counts = countsOf(g, selection[g.id] ?? []);
                      const held = totalCount(counts);

                      return (
                        <div className="qty-list">
                          {g.choices.map((c) => (
                            <div className="qty-row" key={c.id}>
                              <span className="qty-label">{c.label}</span>
                              <div className="qty-control">
                                <button
                                  type="button"
                                  className="qty-btn"
                                  onClick={() => bump(g, c.id, -1)}
                                  disabled={(counts[c.id] ?? 0) === 0}
                                  aria-label={`One fewer ${c.label}`}
                                >
                                  −
                                </button>
                                <span className="qty-value">
                                  {counts[c.id] ?? 0}
                                </span>
                                <button
                                  type="button"
                                  className="qty-btn"
                                  onClick={() => bump(g, c.id, 1)}
                                  disabled={held >= need}
                                  aria-label={`One more ${c.label}`}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}

                          <p
                            className={`qty-status${held === need ? " is-done" : ""}`}
                            aria-live="polite"
                          >
                            Selected screens: {held} / {need}
                          </p>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="check-list">
                      {g.choices.map((c) => (
                        <label className="check" key={c.id}>
                          <input
                            type="checkbox"
                            checked={(selection[g.id] ?? []).includes(c.id)}
                            onChange={() => toggle(g.id, c.id)}
                          />
                          <span>
                            {c.label}
                            {c.note && (
                              <span className="plan-meta">{c.note}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )
                ) : (
                  <div
                    className="plan-list"
                    role="radiogroup"
                    aria-label={g.label}
                  >
                    {g.choices.map((c) => {
                      const selected = selection[g.id]?.[0] === c.id;

                      return (
                        <button
                          type="button"
                          key={c.id}
                          role="radio"
                          aria-checked={selected}
                          className={`plan${selected ? " is-selected" : ""}`}
                          onClick={() => pick(g.id, c.id)}
                        >
                          <span className="plan-radio" aria-hidden="true" />
                          <span className="plan-text">
                            <span className="plan-name">{c.label}</span>
                            {c.note && (
                              <span className="plan-meta">{c.note}</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <>
            <h2 className="block-title" id="plans">
              Choose a plan
            </h2>
            <div
              className="plan-list"
              role="radiogroup"
              aria-label="Choose a plan"
            >
              {product.plans.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  role="radio"
                  aria-checked={p.id === planId}
                  className={`plan${p.id === planId ? " is-selected" : ""}`}
                  onClick={() => {
                    setPlanId(p.id);
                    setAdded(false);
                  }}
                >
                  <span className="plan-radio" aria-hidden="true" />
                  <span className="plan-text">
                    <span className="plan-name">
                      {p.name}
                      {p.badge && (
                        <span className="badge badge-primary">{p.badge}</span>
                      )}
                    </span>
                    <span className="plan-meta">{p.meta.join(" • ")}</span>
                    {p.note && <span className="plan-note">{p.note}</span>}
                  </span>
                  <span className="plan-price">{formatPrice(p.price)}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {children}
      </div>

      <aside className="summary-card">
        <div className="summary-row">
          <span>Product</span>
          <strong>{product.title}</strong>
        </div>

        {advanced && split ? (
          <>
            <div className="summary-row">
              <span>Plan</span>
              <strong>{split.planName || "—"}</strong>
            </div>
            {split.meta && (
              <div className="summary-row">
                <span>Devices</span>
                <span>{split.meta}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="summary-row">
              <span>Plan</span>
              <strong>{plan.name}</strong>
            </div>
            <div className="summary-row">
              <span>Includes</span>
              <span>{plan.meta.join(" • ")}</span>
            </div>
          </>
        )}

        <div className="summary-row">
          <span>Warranty</span>
          <span>{product.warranty}</span>
        </div>

        <div className="summary-total">
          <span>Total</span>
          <strong>{complete ? formatPrice(price) : "—"}</strong>
        </div>

        <div className="summary-actions">
          {whatsapp && !soldOut && complete && (
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
          <button
            type="button"
            className="btn btn-secondary btn-block"
            disabled={soldOut || !complete}
            onClick={() => {
              add(line);
              setAdded(true);
            }}
          >
            {added ? "Added to cart" : "Add to cart"}
          </button>
          <button
            type="button"
            className="btn btn-dark btn-block"
            disabled={soldOut || !complete}
            onClick={() => {
              add(line);
              router.push("/order");
            }}
          >
            Order on site
          </button>
        </div>

        <p className={`helper-text${pending ? " is-warning" : ""}`} role={pending ? "status" : undefined}>
          {pending
            ? pendingNote
            : "Cart several products and complete them in one order, or place this one on its own. You upload your payment proof and we deliver once it is verified."}
        </p>
      </aside>
    </div>
  );
}

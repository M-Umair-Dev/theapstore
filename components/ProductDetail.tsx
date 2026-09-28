"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useCart } from "@/lib/cart";
import {
  cheapestWithChoice,
  defaultSelection,
  describeSelection,
  hasOptions,
  isComplete,
  lineFor,
  priceFor,
  priceWithChoice,
  slotCount,
  slotGroups,
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
  const [selection, setSelection] = useState<Selection>(() =>
    advanced ? defaultSelection(product) : {},
  );
  const [added, setAdded] = useState(false);

  const soldOut = product.comingSoon;

  /* ---- simple products ---- */
  const plan = product.plans.find((p) => p.id === planId) ?? product.plans[0];

  /* ---- option products ---- */
  const complete = !advanced || isComplete(product, selection);
  const split = advanced ? describeSelection(product, selection) : null;

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

  /** Picks a value for a single-choice group and re-sizes the device slots. */
  function pick(groupId: string, choiceId: string) {
    setAdded(false);
    setSelection((prev) => {
      const next: Selection = { ...prev, [groupId]: [choiceId] };

      for (const g of slotGroups(product)) {
        const count = slotCount(product, next);
        const before = next[g.id] ?? [];
        next[g.id] = Array.from(
          { length: count },
          (_, i) => before[i] ?? g.choices[0]?.id ?? "",
        );
      }
      return next;
    });
  }

  function pickSlot(groupId: string, index: number, choiceId: string) {
    setAdded(false);
    setSelection((prev) => {
      const slots = [...(prev[groupId] ?? [])];
      slots[index] = choiceId;
      return { ...prev, [groupId]: slots };
    });
  }

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
          <span className="in-stock">{soldOut ? "Coming soon" : "In stock"}</span>
        </div>

        {advanced ? (
          <div id="plans">
            {(product.optionGroups ?? []).map((g) => (
              <section key={g.id}>
                <h2 className="block-title">{g.label}</h2>

                {g.kind === "slots" ? (
                  <div className="slot-list">
                    {Array.from(
                      { length: slotCount(product, selection) },
                      (_, i) => (
                        <div className="slot" key={`${g.id}-${i}`}>
                          <span className="slot-label">
                            {g.label} — device {i + 1}
                          </span>
                          <div className="slot-choices">
                            {g.choices.map((c) => (
                              <button
                                type="button"
                                key={c.id}
                                className={`btn btn-sm ${
                                  selection[g.id]?.[i] === c.id
                                    ? "btn-primary"
                                    : "btn-secondary"
                                }`}
                                onClick={() => pickSlot(g.id, i, c.id)}
                              >
                                {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="plan-list" role="radiogroup" aria-label={g.label}>
                    {g.choices.map((c) => {
                      const selected = selection[g.id]?.[0] === c.id;
                      // Priced groups advertise their cheapest cell; multiplier
                      // groups show what this choice would cost right now,
                      // which needs the rest of the selection to be complete.
                      const preview = g.priced
                        ? cheapestWithChoice(product, g.id, c.id)
                        : g.multiplies && complete
                          ? priceWithChoice(product, selection, g.id, c.id)
                          : undefined;

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
                          {preview !== undefined && (
                            <span className="plan-price">
                              {formatPrice(preview)}
                            </span>
                          )}
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

        <p className="helper-text">
          {complete
            ? "Cart several products and complete them in one order, or place this one on its own. You upload your payment proof and we deliver once it is verified."
            : "Pick an option in every section above and the price will appear here."}
        </p>
      </aside>
    </div>
  );
}

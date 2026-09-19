"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useCart } from "@/lib/cart";
import { formatPrice, getCategoryName, type Product } from "@/lib/products";
import { orderMessage, waLink } from "@/lib/whatsapp";

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
  const [planId, setPlanId] = useState(product.plans[0].id);
  const [added, setAdded] = useState(false);

  const plan = product.plans.find((p) => p.id === planId) ?? product.plans[0];
  const whatsapp = waLink(orderMessage({ product, plan }));
  const soldOut = product.comingSoon;

  const line = {
    slug: product.slug,
    planId: plan.id,
    title: product.title,
    planName: plan.name,
    meta: plan.meta.join(" • "),
    price: plan.price,
  };

  return (
    <div className="container pd-layout">
      <div>
        <div className="pd-media" aria-hidden={product.imageContentType ? undefined : true}>
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
          <span className="pd-price">{formatPrice(plan.price)}</span>
          <span className="in-stock">
            {soldOut ? "Coming soon" : "In stock"}
          </span>
        </div>

        <h2 className="block-title" id="plans">
          Choose a plan
        </h2>
        <div className="plan-list" role="radiogroup" aria-label="Choose a plan">
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

        {children}
      </div>

      <aside className="summary-card">
        <div className="summary-row">
          <span>Product</span>
          <strong>{product.title}</strong>
        </div>
        <div className="summary-row">
          <span>Plan</span>
          <strong>{plan.name}</strong>
        </div>
        <div className="summary-row">
          <span>Includes</span>
          <span>{plan.meta.join(" • ")}</span>
        </div>
        <div className="summary-row">
          <span>Warranty</span>
          <span>{product.warranty}</span>
        </div>

        <div className="summary-total">
          <span>Total</span>
          <strong>{formatPrice(plan.price)}</strong>
        </div>

        <div className="summary-actions">
          {whatsapp && !soldOut && (
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
            disabled={soldOut}
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
            disabled={soldOut}
            onClick={() => {
              add(line);
              router.push("/order");
            }}
          >
            Order on site
          </button>
        </div>

        <p className="helper-text">
          Cart several products and complete them in one order, or place this
          one on its own. Either way you upload your payment proof and we
          deliver the access once it is verified.
        </p>
      </aside>
    </div>
  );
}

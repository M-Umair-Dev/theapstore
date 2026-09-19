"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProductAction, type ActionState } from "@/app/admin/actions";
import { categories, type Product } from "@/lib/products";

const initial: ActionState = {};

type Row = {
  key: string;
  id: string;
  name: string;
  meta: string;
  price: string;
  note: string;
  badge: string;
};

let rowSeq = 0;
const newRow = (): Row => ({
  key: `row-${rowSeq++}`,
  id: "",
  name: "",
  meta: "",
  price: "",
  note: "",
  badge: "",
});

export default function ProductForm({ product }: { product?: Product }) {
  const [state, action, pending] = useActionState(saveProductAction, initial);

  const [rows, setRows] = useState<Row[]>(() =>
    product && product.plans.length > 0
      ? product.plans.map((p) => ({
          key: `row-${rowSeq++}`,
          id: p.id,
          name: p.name,
          meta: p.meta.join(", "),
          price: String(p.price),
          note: p.note ?? "",
          badge: p.badge ?? "",
        }))
      : [newRow()],
  );

  const patch = (key: string, field: keyof Row, value: string) =>
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );

  return (
    <form action={action} className="admin-form">
      {product && (
        <input type="hidden" name="originalSlug" value={product.slug} />
      )}

      <div className="admin-panel">
        <h2>Product</h2>

        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              className="input"
              defaultValue={product?.title}
              placeholder="Netflix Premium Subscription"
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="slug">
              URL slug
            </label>
            <input
              id="slug"
              name="slug"
              className="input"
              defaultValue={product?.slug}
              placeholder="generated from the title if left blank"
            />
            <span className="hint">
              Changing this changes the product URL. The old one stops working.
            </span>
          </div>

          <div className="field">
            <label className="label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="select"
              defaultValue={product?.category ?? ""}
              required
            >
              <option value="">Choose a category</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="warranty">
              Warranty
            </label>
            <input
              id="warranty"
              name="warranty"
              className="input"
              defaultValue={product?.warranty}
              placeholder="28-Day Replacement Warranty"
            />
          </div>

          <div className="field field-full">
            <label className="label" htmlFor="tagline">
              Card tagline
            </label>
            <input
              id="tagline"
              name="tagline"
              className="input"
              defaultValue={product?.tagline}
              placeholder="4K Ultra HD quality"
            />
          </div>

          <div className="field field-full">
            <label className="label" htmlFor="summary">
              Summary
            </label>
            <textarea
              id="summary"
              name="summary"
              className="textarea"
              defaultValue={product?.summary}
              placeholder="One paragraph describing the product."
            />
          </div>

          <div className="field field-full">
            <label className="label" htmlFor="badges">
              Badges
            </label>
            <input
              id="badges"
              name="badges"
              className="input"
              defaultValue={product?.badges.join(", ")}
              placeholder="Popular, Pakistan Plans"
            />
            <span className="hint">
              Comma separated. Shown on the product card image.
            </span>
          </div>

          <div className="field field-full">
            <label className="label" htmlFor="specs">
              Key features
            </label>
            <textarea
              id="specs"
              name="specs"
              className="textarea"
              defaultValue={product?.specs.join("\n")}
              placeholder={"One feature per line.\n4K Ultra HD quality\n28-day replacement warranty"}
            />
            <span className="hint">One per line.</span>
          </div>
        </div>

        <div className="check-row" style={{ marginTop: "var(--space-5)" }}>
          <label className="check">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured}
            />
            Show on the home page
          </label>
          <label className="check">
            <input
              type="checkbox"
              name="comingSoon"
              defaultChecked={product?.comingSoon}
            />
            Coming soon (hides the buy buttons)
          </label>
        </div>
      </div>

      <div className="admin-panel">
        <h2>Image</h2>
        <p className="hint" style={{ marginBottom: "var(--space-5)" }}>
          JPEG, PNG, WebP, AVIF or GIF, up to 4 MB. Without an image the card
          shows a letter tile instead.
        </p>

        {product && (
          <input
            type="hidden"
            name="currentImageType"
            value={product.imageContentType ?? ""}
          />
        )}

        {product?.imageContentType && (
          <div className="image-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/image/${product.slug}`}
              alt={`${product.title} preview`}
            />
            <label className="check">
              <input type="checkbox" name="removeImage" />
              Remove the current image
            </label>
          </div>
        )}

        <div className="field" style={{ marginTop: "var(--space-4)" }}>
          <label className="label" htmlFor="image">
            {product?.imageContentType ? "Replace image" : "Upload image"}
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="input"
          />
        </div>
      </div>

      <div className="admin-panel">
        <h2>Plans</h2>
        <p className="hint" style={{ marginBottom: "var(--space-5)" }}>
          At least one plan is required. Price is the full price for that plan in
          rupees.
        </p>

        <div className="repeat-list">
          {rows.map((row, index) => (
            <div className="repeat-item" key={row.key}>
              <div className="repeat-head">
                <span>Plan {index + 1}</span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() =>
                      setRows((prev) => prev.filter((r) => r.key !== row.key))
                    }
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-row form-row-3">
                <div className="field">
                  <label className="label" htmlFor={`${row.key}-name`}>
                    Name
                  </label>
                  <input
                    id={`${row.key}-name`}
                    name="planName"
                    className="input"
                    value={row.name}
                    onChange={(e) => patch(row.key, "name", e.target.value)}
                    placeholder="Single Screen"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor={`${row.key}-price`}>
                    Price (Rs.)
                  </label>
                  <input
                    id={`${row.key}-price`}
                    name="planPrice"
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={row.price}
                    onChange={(e) => patch(row.key, "price", e.target.value)}
                    placeholder="549"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor={`${row.key}-meta`}>
                    Details
                  </label>
                  <input
                    id={`${row.key}-meta`}
                    name="planMeta"
                    className="input"
                    value={row.meta}
                    onChange={(e) => patch(row.key, "meta", e.target.value)}
                    placeholder="1 Screen, 4K Ultra HD, 1 Month"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor={`${row.key}-id`}>
                    Plan ID
                  </label>
                  <input
                    id={`${row.key}-id`}
                    name="planId"
                    className="input"
                    value={row.id}
                    onChange={(e) => patch(row.key, "id", e.target.value)}
                    placeholder="Auto-generated"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor={`${row.key}-note`}>
                    Note
                  </label>
                  <input
                    id={`${row.key}-note`}
                    name="planNote"
                    className="input"
                    value={row.note}
                    onChange={(e) => patch(row.key, "note", e.target.value)}
                    placeholder="Dedicated private access"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor={`${row.key}-badge`}>
                    Badge
                  </label>
                  <input
                    id={`${row.key}-badge`}
                    name="planBadge"
                    className="input"
                    value={row.badge}
                    onChange={(e) => patch(row.key, "badge", e.target.value)}
                    placeholder="Best value"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm add-btn"
          style={{ marginTop: "var(--space-4)" }}
          onClick={() => setRows((prev) => [...prev, newRow()])}
        >
          Add another plan
        </button>
      </div>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending}
        >
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        <Link href="/admin/products" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

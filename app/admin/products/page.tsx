import Link from "next/link";
import { deleteProductAction } from "@/app/admin/actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { formatPrice, getCategoryName, priceFrom } from "@/lib/products";
import { listProducts } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const { saved, deleted } = await searchParams;
  const products = await listProducts();

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Products</h1>
          <p>{products.length} in the catalogue.</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          Add product
        </Link>
      </div>

      {saved && (
        <p className="form-success" style={{ marginBottom: "var(--space-5)" }}>
          Saved <strong>{saved}</strong>.
        </p>
      )}
      {deleted && (
        <p className="form-success" style={{ marginBottom: "var(--space-5)" }}>
          Product deleted.
        </p>
      )}

      <div className="admin-panel">
        {products.length === 0 ? (
          <p className="hint">
            No products yet. Run <code>npm run seed</code> to load the starter
            catalogue, or add one here.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Plans</th>
                  <th>From</th>
                  <th>Flags</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.slug}>
                    <td>
                      {product.title}
                      <br />
                      <span className="muted">/{product.slug}</span>
                    </td>
                    <td className="muted nowrap">
                      {getCategoryName(product.category)}
                    </td>
                    <td>{product.plans.length}</td>
                    <td className="nowrap">{formatPrice(priceFrom(product))}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {product.featured && (
                          <span className="pill pill-primary">Featured</span>
                        )}
                        {product.comingSoon && (
                          <span className="pill pill-off">Coming soon</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          href={`/product/${product.slug}`}
                          target="_blank"
                          className="link-btn"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/products/${product.slug}`}
                          className="link-btn"
                        >
                          Edit
                        </Link>
                        <form action={deleteProductAction}>
                          <input
                            type="hidden"
                            name="slug"
                            value={product.slug}
                          />
                          <ConfirmSubmit
                            message={`Delete "${product.title}"? This cannot be undone.`}
                          >
                            Delete
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

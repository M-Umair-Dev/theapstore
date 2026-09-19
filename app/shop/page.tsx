import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import FilterPanel from "@/components/FilterPanel";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";
import { filterProducts, isSort, shopHref } from "@/lib/catalogue";
import { getCategory, getCategoryName } from "@/lib/products";
import { listProducts } from "@/lib/repo";

export const dynamic = "force-dynamic";

type Params = {
  category?: string;
  band?: string;
  sort?: string;
  page?: string;
};

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse our digital catalogue of subscriptions, tools, software and services.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const sp = await searchParams;
  const all = await listProducts();

  const category = getCategory(sp.category ?? "") ? sp.category : undefined;
  const sort = isSort(sp.sort) ? sp.sort : "featured";
  const parsedPage = Number(sp.page ?? 1);

  const { items, total, pages, page } = filterProducts(all, {
    category,
    band: sp.band,
    sort,
    page: Number.isFinite(parsedPage) ? parsedPage : 1,
  });

  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Shop" }]} />

      <div className="container" style={{ paddingTop: "var(--space-6)" }}>
        <h1 className="section-title">Shop</h1>
        <p className="section-lead">
          Browse our digital catalogue of subscriptions, tools, software and
          services.
          {category && ` Showing ${getCategoryName(category)} only.`}
        </p>
      </div>

      <div
        className="container shop-layout"
        style={{ paddingBlock: "var(--space-7) var(--space-8)" }}
      >
        <FilterPanel
          products={all}
          category={category}
          band={sp.band}
          sort={sort}
        />

        <div>
          <div className="sort-bar">
            <span className="result-count">
              {total} {total === 1 ? "result" : "results"}
            </span>
            <SortSelect sort={sort} category={category} band={sp.band} />
          </div>

          {items.length === 0 ? (
            <div className="empty-state">
              <h2>No products match these filters</h2>
              <p>
                Try a different category or price range — the full catalogue is
                one click away.
              </p>
              <Link href="/shop" className="btn btn-primary">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-3">
              {items.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={shopHref({ category, band: sp.band, sort, page: n })}
                  className={`page-link${n === page ? " is-active" : ""}`}
                  aria-current={n === page ? "page" : undefined}
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import FilterPanel from "@/components/FilterPanel";
import ProductCard from "@/components/ProductCard";
import SearchBox from "@/components/SearchBox";
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
  q?: string;
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
  const q = sp.q?.trim() || undefined;

  const { items, total, pages, page } = filterProducts(all, {
    category,
    band: sp.band,
    sort,
    page: Number.isFinite(parsedPage) ? parsedPage : 1,
    q,
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
          q={q}
        />

        <div>
          <div className="shop-search">
            {/* `live` re-runs the search as the customer types, keeping the
                other filters, sorting and pagination in the URL. */}
            <SearchBox
              initial={q ?? ""}
              live
              base={{ category, band: sp.band, sort }}
            />
          </div>

          <div className="sort-bar">
            <span className="result-count">
              {total} {total === 1 ? "result" : "results"}
              {q && ` for “${q}”`}
            </span>
            <SortSelect sort={sort} category={category} band={sp.band} q={q} />
          </div>

          {items.length === 0 ? (
            <div className="empty-state">
              <h2>
                {q ? "No products found" : "No products match these filters"}
              </h2>
              <p>
                {q
                  ? "Try another search, or clear it to see the full catalogue."
                  : "Try a different category or price range — the full catalogue is one click away."}
              </p>
              <Link href="/shop" className="btn btn-primary">
                {q ? "Clear search" : "Clear filters"}
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
                  href={shopHref({
                    category,
                    band: sp.band,
                    sort,
                    page: n,
                    q,
                  })}
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

import Link from "next/link";
import { shopHref } from "@/lib/catalogue";
import { categories } from "@/lib/products";
import type { Product } from "@/lib/products";
import { priceBands } from "@/lib/catalogue";

export default function FilterPanel({
  products,
  category,
  band,
  sort,
}: {
  products: Product[];
  category?: string;
  band?: string;
  sort?: string;
}) {
  return (
    <aside className="filters" aria-label="Filters and categories">
      <div className="filter-group">
        <h3>Categories</h3>
        <Link
          href={shopHref({ band, sort })}
          className={`filter-link${!category ? " is-active" : ""}`}
        >
          All products
          <span className="filter-count">{products.length}</span>
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={shopHref({ category: c.slug, band, sort })}
            className={`filter-link${category === c.slug ? " is-active" : ""}`}
          >
            {c.name}
            <span className="filter-count">
              {products.filter((p) => p.category === c.slug).length}
            </span>
          </Link>
        ))}
      </div>

      <div className="filter-group">
        <h3>Price Range</h3>
        {priceBands.map((b) => (
          <Link
            key={b.slug}
            href={shopHref({
              category,
              band: band === b.slug ? undefined : b.slug,
              sort,
            })}
            className={`filter-link${band === b.slug ? " is-active" : ""}`}
          >
            {b.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

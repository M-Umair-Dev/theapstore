import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import { getCategory } from "@/lib/products";
import { productsInCategory } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const category = getCategory((await params).slug);
  if (!category) return {};
  return { title: category.name, description: category.description };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const items = await productsInCategory(slug);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/shop", label: "Shop" },
          { label: category.name },
        ]}
      />

      <div className="container" style={{ paddingTop: "var(--space-6)" }}>
        <h1 className="section-title">{category.name}</h1>
        <p className="section-lead">
          {category.description} {items.length}{" "}
          {items.length === 1 ? "product" : "products"} available.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="container" style={{ paddingBlock: "var(--space-7)" }}>
          <div className="empty-state">
            <h2>Nothing in this category yet</h2>
            <p>Browse the rest of the catalogue while we restock.</p>
            <Link href="/shop" className="btn btn-primary">
              Go to the shop
            </Link>
          </div>
        </div>
      ) : (
        <div
          className="container grid grid-3"
          style={{ paddingBlock: "var(--space-7)" }}
        >
          {items.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}

      <div className="container" style={{ paddingBottom: "var(--space-8)" }}>
        <Link href="/shop" className="btn btn-secondary">
          Browse the full shop
        </Link>
      </div>
    </>
  );
}

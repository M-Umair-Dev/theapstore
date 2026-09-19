import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { categories } from "@/lib/products";
import { listProducts } from "@/lib/repo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Every product grouped into six clear categories so you can find the subscription, tool or service you need.",
};

export default async function CategoriesPage() {
  const all = await listProducts();
  const withCounts = categories.map((c) => ({
    ...c,
    count: all.filter((p) => p.category === c.slug).length,
  }));

  return (
    <>
      <Breadcrumbs
        items={[{ href: "/", label: "Home" }, { label: "Categories" }]}
      />

      <div className="container" style={{ paddingTop: "var(--space-6)" }}>
        <h1 className="section-title">Categories</h1>
        <p className="section-lead">
          The catalogue is grouped so you can find the subscriptions, tools and
          services you need without hunting through the whole store.
        </p>
      </div>

      <div
        className="container grid grid-3"
        style={{ paddingBlock: "var(--space-7) var(--space-8)" }}
      >
        {withCounts.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="cat-tile">
            <span className="cat-count">{c.count} products</span>
            <span className="cat-name">{c.name}</span>
            <span className="cat-desc">{c.description}</span>
          </Link>
        ))}
      </div>

      <section className="section dark cta-band">
        <div className="container">
          <h2>Not sure where to start?</h2>
          <p>
            Browse everything in one place, or send us a message and we will
            point you at the right plan.
          </p>
          <div className="hero-actions">
            <Link href="/shop" className="btn btn-primary">
              Browse all products
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Ask a question
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

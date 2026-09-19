import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import { getCategoryName } from "@/lib/products";
import { getProductBySlug, productsInCategory } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return { title: product.title, description: product.summary };
}

const guidelines = [
  "Use only the access type stated on your plan.",
  "Do not alter passwords, recovery information, billing or security settings unless the delivery instructions tell you to.",
  "Do not exceed the users, profiles, screens or devices included in your plan.",
  "Keep your credentials private, and contact support before making major changes to an account.",
  "Product-specific terms override these general guidelines where they differ.",
];

const faqs = [
  {
    q: "How do I receive my order?",
    a: "After payment is verified we send your credentials or access details by email, usually within the hour. Track the order any time from your account page.",
  },
  {
    q: "How does the warranty work?",
    a: "The warranty covers access problems for the period shown on this page. If your access stops working, contact us and we replace it at no cost.",
  },
  {
    q: "How do I order?",
    a: "Add the plan to your cart and complete the order on the site, or message us if you would rather do it in chat.",
  },
];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [inCategory, session] = await Promise.all([
    productsInCategory(product.category),
    auth(),
  ]);

  const isAdmin = session?.user?.role === "admin";
  const related = inCategory
    .filter((p) => p.slug !== product.slug)
    .slice(0, 3);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/shop", label: "Shop" },
          {
            href: `/category/${product.category}`,
            label: getCategoryName(product.category),
          },
          { label: product.title },
        ]}
      />

      <ProductDetail product={product} isAdmin={isAdmin}>
        <h2 className="block-title">Key features</h2>
        <ul className="spec-list">
          {product.specs.map((spec) => (
            <li key={spec}>{spec}</li>
          ))}
        </ul>

        <h2 className="block-title">Delivery</h2>
        <p className="pd-summary">
          Pick a plan, then complete the order on the site and upload your
          payment proof. We verify it and deliver your access. Most orders
          placed during business hours arrive within the hour.
        </p>

        <h2 className="block-title">Important access and account guidelines</h2>
        <ul className="includes-list">
          {guidelines.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>

        <h2 className="block-title">Frequently asked questions</h2>
        <div
          style={{
            display: "grid",
            gap: "var(--space-5)",
            marginTop: "var(--space-4)",
          }}
        >
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 style={{ fontSize: 16 }}>{f.q}</h3>
              <p className="pd-summary" style={{ marginTop: "var(--space-2)" }}>
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </ProductDetail>

      {related.length > 0 && (
        <section className="section section-surface">
          <div className="container">
            <div className="section-head">
              <div>
                <h2 className="section-title">You may also like</h2>
                <p className="section-lead">
                  More from {getCategoryName(product.category)}.
                </p>
              </div>
              <Link
                href={`/category/${product.category}`}
                className="section-link"
              >
                View all
              </Link>
            </div>

            <div className="grid grid-3">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

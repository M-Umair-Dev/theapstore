import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { posts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides and plain-English explainers about the subscriptions we sell.",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function BlogPage() {
  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Blog" }]} />

      <div className="container" style={{ paddingTop: "var(--space-6)" }}>
        <h1 className="section-title">Blog</h1>
        <p className="section-lead">
          Guides and explainers about the subscriptions and tools we sell —
          written to answer the questions we get before an order.
        </p>
      </div>

      <div
        className="container grid grid-2"
        style={{ paddingBlock: "var(--space-7) var(--space-8)" }}
      >
        {posts.map((post) => (
          <article className="value-card" key={post.slug}>
            <span className="cat-count">{formatDate(post.date)}</span>
            <h2 style={{ fontSize: 20, marginTop: "var(--space-3)" }}>
              {post.title}
            </h2>
            <p style={{ marginTop: "var(--space-3)" }}>{post.excerpt}</p>
          </article>
        ))}
      </div>

      <section className="section dark cta-band">
        <div className="container">
          <h2>Have a question we have not written about?</h2>
          <p>Send it over and it may become the next post — you get an answer either way.</p>
          <div className="hero-actions">
            <Link href="/contact" className="btn btn-primary">
              Ask a question
            </Link>
            <Link href="/shop" className="btn btn-secondary">
              Browse the shop
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

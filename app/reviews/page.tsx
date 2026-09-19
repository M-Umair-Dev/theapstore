import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { reviews } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reviews",
  description: `What customers say about ${site.name} after ordering.`,
};

export default function ReviewsPage() {
  const average =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Reviews" }]} />

      <div className="container" style={{ paddingTop: "var(--space-6)" }}>
        <h1 className="section-title">Reviews</h1>
        <p className="section-lead">
          {average.toFixed(1)} out of 5 across {reviews.length} recent orders.
          Every review below comes from a verified purchase.
        </p>
      </div>

      <div
        className="container grid grid-3"
        style={{ paddingBlock: "var(--space-7) var(--space-8)" }}
      >
        {reviews.map((r) => (
          <div className="review-card" key={r.author}>
            <span className="stars" aria-label={`${r.rating} out of 5`}>
              {"★".repeat(r.rating)}
              {"☆".repeat(5 - r.rating)}
            </span>
            <blockquote>{r.body}</blockquote>
            <div>
              <div className="review-author">{r.author}</div>
              <div className="review-product">{r.product}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="section dark cta-band">
        <div className="container">
          <h2>Ordered from us before?</h2>
          <p>
            Send us your experience and we will add it to this page. We publish
            the critical ones too.
          </p>
          <div className="hero-actions">
            <Link href="/contact" className="btn btn-primary">
              Send a review
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

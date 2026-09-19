import Link from "next/link";
import CardActions from "@/components/CardActions";
import {
  formatPrice,
  getCategoryName,
  priceFrom,
  type Product,
} from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  const plan = product.plans[0];
  const from = priceFrom(product);
  const ranged = product.plans.length > 1;

  return (
    <article className="card">
      <div className="card-media">
        {product.imageContentType ? (
          // Served from /api/image so the bytes stay in the database.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/image/${product.slug}`} alt={product.title} />
        ) : (
          <span aria-hidden="true">{product.title.charAt(0)}</span>
        )}
        {product.badges.length > 0 && (
          <div className="card-media-badges">
            {product.badges.map((badge) => (
              <span
                key={badge}
                className={
                  badge === "Popular" || badge === "Best seller"
                    ? "badge badge-primary"
                    : "badge badge-dark"
                }
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card-body">
        <span className="card-cat">{getCategoryName(product.category)}</span>
        <h3 className="card-title">
          <Link href={`/product/${product.slug}`}>{product.title}</Link>
        </h3>
        <p className="card-tag">{product.tagline}</p>
        <p className="card-price">
          {ranged && <span>From </span>}
          {formatPrice(from)}
        </p>
        <p className="card-warranty">{product.warranty}</p>

        <CardActions
          line={{
            slug: product.slug,
            planId: plan.id,
            title: product.title,
            planName: plan.name,
            meta: plan.meta.join(" • "),
            price: plan.price,
          }}
          disabled={product.comingSoon}
        />

        <Link href={`/product/${product.slug}`} className="btn btn-ghost btn-sm">
          View details
        </Link>
      </div>
    </article>
  );
}

import Link from "next/link";
import CardActions from "@/components/CardActions";
import { defaultLine, hasOptions, startingPrice } from "@/lib/options";
import { formatPrice, getCategoryName, type Product } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  const from = startingPrice(product);
  const ranged = (product.prices?.length ?? product.plans.length) > 1;

  // Products sold through the option matrix cannot be added from the card —
  // the customer has to pick a duration, screen and devices first, so the
  // card sends them to the selectors instead of guessing a combination.
  const chooseHref = hasOptions(product)
    ? `/product/${product.slug}#plans`
    : undefined;

  return (
    <article className="card">
      <Link
        href={`/product/${product.slug}`}
        className="card-open"
        aria-hidden="true"
        tabIndex={-1}
      />
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
          line={defaultLine(product)}
          disabled={product.comingSoon}
          chooseHref={chooseHref}
        />

        <Link href={`/product/${product.slug}`} className="btn btn-ghost btn-sm">
          View details
        </Link>
      </div>
    </article>
  );
}

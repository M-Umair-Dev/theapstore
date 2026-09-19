import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { formatPrice, priceFrom, categories } from "@/lib/products";
import { listProducts } from "@/lib/repo";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const values = [
  {
    title: `Trusted since ${site.since}`,
    body: "Thousands of orders delivered, with a warranty on every plan we sell.",
  },
  {
    title: "Order in minutes",
    body: "Pick a plan, pay, upload your proof. Most orders land within the hour.",
  },
  {
    title: "Support that answers",
    body: "Real people on WhatsApp and email, before and after the sale.",
  },
  {
    title: "One store, every tool",
    body: "Streaming, AI, productivity, design, VPN and live TV in one place.",
  },
];

const steps = [
  {
    title: "Pick your product and plan",
    body: "Choose the service, then the duration or screen count that fits how you watch.",
  },
  {
    title: "Complete payment",
    body: "Pay by bank transfer, Easypaisa or JazzCash, then upload your proof on the order page.",
  },
  {
    title: "Receive your access",
    body: "We verify the payment and send your subscription, credentials or invite — usually within the hour.",
  },
];

export default async function Home() {
  const all = await listProducts();

  if (all.length === 0) {
    return (
      <div className="container" style={{ paddingBlock: "var(--space-8)" }}>
        <div className="empty-state">
          <h2>The store is empty</h2>
          <p>
            No products in the database yet. Run <code>npm run seed</code> with
            your <code>.env.local</code> configured, then reload.
          </p>
        </div>
      </div>
    );
  }

  const featured = all.filter((p) => p.featured).slice(0, 10);
  const promo = all.find((p) => p.slug === "netflix-premium") ?? all[0];
  const cats = categories.map((c) => ({
    ...c,
    count: all.filter((p) => p.category === c.slug).length,
  }));

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Digital store · since {site.since}</span>
            <h1 className="hero-title">
              Your Digital Essentials, All in One Place
            </h1>
            <p className="hero-lead">
              Subscriptions, AI tools, software and security — delivered
              digitally and backed by warranty. Order on the site or send us a
              message, whichever is easier.
            </p>

            <div className="hero-actions">
              <Link href="/shop" className="btn btn-primary">
                Shop Now
              </Link>
              <Link href="/categories" className="btn btn-secondary">
                Explore Categories
              </Link>
            </div>

            <ul className="trust-list">
              <li>Instant digital delivery on every plan</li>
              <li>Order on the site or over WhatsApp</li>
              <li>Warranty and replacement support included</li>
            </ul>

            <div className="chip-row" style={{ marginTop: "var(--space-6)" }}>
              <span className="chip">AI Tools</span>
              <span className="chip">Productivity</span>
              <span className="chip">Streaming</span>
              <span className="chip">Entertainment</span>
              <span className="chip">Digital delivery</span>
            </div>
          </div>

          <Link href={`/product/${promo.slug}`} className="promo-tile">
            <span className="badge badge-primary">
              {promo.badges[0] ?? "Featured"}
            </span>
            <h3 style={{ marginTop: "var(--space-4)" }}>{promo.title}</h3>
            <p className="promo-price">From {formatPrice(priceFrom(promo))}</p>
            <p className="promo-meta">
              {promo.tagline}
              <br />
              {promo.warranty}
            </p>
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">Featured products</h2>
              <p className="section-lead">
                The plans our customers order most, across every category in the
                store.
              </p>
            </div>
            <Link href="/shop" className="section-link">
              View all products
            </Link>
          </div>

          <div className="grid grid-4">
            {featured.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-surface">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">Browse by category</h2>
              <p className="section-lead">
                Every product in the store is grouped so you can find what you
                need without scrolling.
              </p>
            </div>
            <Link href="/categories" className="section-link">
              All categories
            </Link>
          </div>

          <div className="grid grid-3">
            {cats.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="cat-tile"
              >
                <span className="cat-count">{c.count} products</span>
                <span className="cat-name">{c.name}</span>
                <span className="cat-desc">{c.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">Why choose {site.name}</h2>
              <p className="section-lead">
                Four reasons customers come back for their next subscription.
              </p>
            </div>
          </div>

          <div className="grid grid-4">
            {values.map((v, i) => (
              <div className="value-card" key={v.title}>
                <span className="value-icon" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">How it works</h2>
              <p className="section-lead" style={{ color: "var(--dark-muted)" }}>
                Three steps from picking a plan to using it.
              </p>
            </div>
          </div>

          <div className="steps">
            {steps.map((s) => (
              <div className="step" key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark cta-band" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2>Find the Right Digital Service for You</h2>
          <p>
            Subscriptions, tools and services — each with a warranty and a real
            person behind it.
          </p>
          <div className="hero-actions">
            <Link href="/shop" className="btn btn-primary">
              Explore the Shop
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

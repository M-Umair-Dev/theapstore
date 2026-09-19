import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description: `Who ${site.name} is and how we work.`,
};

const points = [
  {
    title: "Independent",
    body: "We are not affiliated with any of the services we sell. We buy plans, manage them properly, and pass the access on with a warranty.",
  },
  {
    title: "Digital only",
    body: "Nothing ships. Every order arrives by email or WhatsApp, usually within the hour of payment verification.",
  },
  {
    title: "Accountable",
    body: "Every plan carries a warranty. If access fails inside the window, we replace it — no arguing about it.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "About Us" }]} />

      <div className="container prose" style={{ paddingBottom: 0 }}>
        <span className="eyebrow">Digital store · since {site.since}</span>
        <h1 className="section-title">
          A digital store built on keeping its promises
        </h1>
        <p>
          {site.name} started in {site.since} selling a handful of streaming
          plans. Today we carry subscriptions, AI tools, productivity software,
          design apps, VPNs and live TV — all delivered digitally, all covered by
          a warranty.
        </p>
        <p>
          The model is simple. You pick a plan, pay, and upload your proof. We
          verify it, hand over the access, and stay reachable for as long as the
          plan runs. If something breaks, we fix or replace it. That is the whole
          business.
        </p>
      </div>

      <div
        className="container grid grid-3"
        style={{ paddingBlock: "var(--space-7)" }}
      >
        {points.map((p) => (
          <div className="value-card" key={p.title}>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </div>
        ))}
      </div>

      <div className="container" style={{ paddingBottom: "var(--space-8)" }}>
        <div className="prose" style={{ paddingBlock: 0 }}>
          <h2>How we choose what to stock</h2>
          <p>
            A service makes it into the store only if we can support it after the
            sale. That means a stable supply, a clear warranty path, and delivery
            instructions we can explain in plain language. If we cannot support
            it, we do not sell it.
          </p>

          <h2>Reach us</h2>
          <p>
            Email{" "}
            <a href={`mailto:${site.email}`} style={{ color: "var(--primary)" }}>
              {site.email}
            </a>{" "}
            or use the{" "}
            <Link href="/contact" style={{ color: "var(--primary)" }}>
              contact page
            </Link>
            . We answer during business hours and often outside them.
          </p>
        </div>
      </div>

      <section className="section dark cta-band" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2>Ready to order?</h2>
          <p>Every plan in the store is live and in stock unless marked otherwise.</p>
          <div className="hero-actions">
            <Link href="/shop" className="btn btn-primary">
              Explore the Shop
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

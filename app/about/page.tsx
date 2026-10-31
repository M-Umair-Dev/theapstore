import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import AboutPhoto from "@/components/AboutPhoto";
import Breadcrumbs from "@/components/Breadcrumbs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description: `Who ${site.name} is and how we work.`,
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type PointIcon = "independent" | "digital" | "accountable";

function PointMark({ icon }: { icon: PointIcon }) {
  let mark: ReactNode;
  switch (icon) {
    case "independent":
      mark = (
        <>
          <path d="M12 3 5 6v6c0 4.2 2.9 7.2 7 8.5 4.1-1.3 7-4.3 7-8.5V6l-7-3z" />
          <path d="m9 12 2 2 4-4" />
        </>
      );
      break;
    case "digital":
      mark = (
        <>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </>
      );
      break;
    case "accountable":
      mark = (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="m8.8 12.2 2.2 2.2 4.2-4.4" />
        </>
      );
      break;
    default: {
      const unreachable: never = icon;
      return unreachable;
    }
  }

  return (
    <span className="value-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" {...stroke}>
        {mark}
      </svg>
    </span>
  );
}

const points: { icon: PointIcon; title: string; body: string }[] = [
  {
    icon: "independent",
    title: "Independent",
    body: "We are not affiliated with any of the services we sell. We buy plans, manage them properly, and pass the access on with a warranty.",
  },
  {
    icon: "digital",
    title: "Digital only",
    body: "Nothing ships. Every order arrives by email or WhatsApp, usually within an hour of payment verification.",
  },
  {
    icon: "accountable",
    title: "Accountable",
    body: "Every plan carries a warranty. If access fails inside the window, we replace it.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "About Us" }]} />

      <div className="container about-intro">
        <div className="prose about-intro-copy">
          <span className="eyebrow">Digital Store · Since {site.since}</span>
          <h1 className="section-title">
            A Digital Store Built on Keeping Its Promises
          </h1>
          <p>
            {site.name} started in {site.since} selling a handful of streaming
            plans. Today we carry subscriptions, AI tools, productivity software,
            design apps, VPNs, and live TV — all delivered digitally, all covered by
            a warranty.
          </p>
          <p>
            The model is simple. You pick a plan, pay, and upload your proof. We
            verify it, hand over the access, and stay reachable for as long as the
            plan runs. If something breaks, we fix or replace it. That is the whole
            business.
          </p>
        </div>
        <AboutPhoto />
      </div>

      <div
        className="container grid grid-3"
        style={{ paddingBlock: "var(--space-7)" }}
      >
        {points.map((p) => (
          <div className="value-card" key={p.title}>
            <h3 className="value-heading">
              <PointMark icon={p.icon} />
              {p.title}
            </h3>
            <p>{p.body}</p>
          </div>
        ))}
      </div>

      <div className="container" style={{ paddingBottom: "var(--space-8)" }}>
        <div className="prose" style={{ paddingBlock: 0 }}>
          <h2>How We Choose What to Stock</h2>
          <p>
            A service makes it into the store only if we can support it after the
            sale. That means a stable supply, a clear warranty path, and delivery
            instructions we can explain in plain language. If we cannot support
            it, we do not sell it.
          </p>

          <h2>Reach Us</h2>
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
          <h2>Ready to Order?</h2>
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

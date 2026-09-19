/**
 * Pure catalogue helpers. Safe to import from client components — nothing here
 * touches the database. Data access lives in `lib/repo.ts`.
 */

export type Plan = {
  /** Stable id, passed through cart and order URLs. */
  id: string;
  name: string;
  /** Short spec lines, rendered joined by a separator. */
  meta: string[];
  price: number;
  note?: string;
  badge?: string;
};

export type Product = {
  slug: string;
  title: string;
  /** Category slug from `categories`. */
  category: string;
  /** One-line spec shown on the card. */
  tagline: string;
  /** Paragraph on the product page. */
  summary: string;
  badges: string[];
  warranty: string;
  specs: string[];
  plans: Plan[];
  /** MIME type of the uploaded image. Absent means fall back to the letter tile. */
  imageContentType?: string;
  featured?: boolean;
  comingSoon?: boolean;
};

export type Category = {
  slug: string;
  name: string;
  description: string;
};

/** Fixed taxonomy — products reference these by slug. */
export const categories: Category[] = [
  {
    slug: "streaming",
    name: "Streaming & Entertainment",
    description: "Digital entertainment subscriptions and services.",
  },
  {
    slug: "ai",
    name: "AI Tools",
    description: "AI-powered tools and productivity solutions.",
  },
  {
    slug: "productivity",
    name: "Productivity & Study",
    description: "Tools for work, study and everyday productivity.",
  },
  {
    slug: "creative",
    name: "Creative & Design",
    description: "Design, video, editing and creative software.",
  },
  {
    slug: "vpn",
    name: "VPN & Security",
    description: "VPN and online security products.",
  },
  {
    slug: "iptv",
    name: "IPTV",
    description: "Live TV, sports, movies and entertainment in one place.",
  },
];

export const formatPrice = (n: number) => `Rs. ${n.toLocaleString("en-US")}`;

/** Lowest plan price — what cards and the product summary show. */
export const priceFrom = (p: Product) =>
  p.plans.length ? Math.min(...p.plans.map((plan) => plan.price)) : 0;

export const getCategory = (slug: string) =>
  categories.find((c) => c.slug === slug);

export const getCategoryName = (slug: string) =>
  getCategory(slug)?.name ?? slug;

/** Turns a title into a URL slug. Used by the admin product form. */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

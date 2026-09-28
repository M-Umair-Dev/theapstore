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

/* ---------- advanced options ----------
   Simple products use `plans`. Products with a real choice matrix (Netflix,
   Amazon) use `optionGroups` + `prices` instead, and the customer picks a
   value for every group in order. */

export type OptionChoice = {
  id: string;
  label: string;
  /** For a "screens" group: how many device slots this choice grants. */
  count?: number;
  note?: string;
};

export type OptionGroup = {
  id: string;
  label: string;
  /** Priced groups form the price matrix. Unpriced ones are qualifiers. */
  priced?: boolean;
  /**
   * Multiplies the matrix price by the chosen choice's `count` — how the
   * duration group works: 3 months costs three times the monthly price.
   */
  multiplies?: boolean;
  /**
   * "select"  — customer picks one choice.
   * "slots"   — customer fills one slot per unit granted by `slotsFrom`,
   *             picking a choice for each.
   */
  kind?: "select" | "slots";
  /** For kind "slots": the group whose chosen `count` sets the slot total. */
  slotsFrom?: string;
  choices: OptionChoice[];
};

export type PriceRule = {
  /** groupId -> choiceId, for the priced groups only. */
  values: Record<string, string>;
  price: number;
  badge?: string;
};

/** A customer's answers. Every group maps to a list: one entry for "select",
 *  one per slot for "slots". */
export type Selection = Record<string, string[]>;

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
  /** Present on products sold through the option matrix. */
  optionGroups?: OptionGroup[];
  prices?: PriceRule[];
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
    {
    slug: "uncategorized",
    name: "Uncategorized",
    description: "Any Random Product.",
  },
];

export const formatPrice = (n: number) => `Rs. ${n.toLocaleString("en-US")}`;

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

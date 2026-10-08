import { startingPrice } from "./options";
import type { Product } from "./products";

export const PAGE_SIZE = 9;

/** How many products the header search dropdown offers. */
export const searchLimit = 6;

export const sorts = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
} as const;

export type Sort = keyof typeof sorts;

export const isSort = (v: string | undefined): v is Sort => !!v && v in sorts;

const priceBands = [
  { slug: "under-500", label: "Under Rs. 500", min: 0, max: 499 },
  { slug: "500-1500", label: "Rs. 500 – 1,500", min: 500, max: 1500 },
  { slug: "1500-3000", label: "Rs. 1,500 – 3,000", min: 1501, max: 3000 },
  { slug: "above-3000", label: "Above Rs. 3,000", min: 3001, max: Infinity },
];

export { priceBands };

/** The one definition of "this product matches the search box". Case
 *  insensitive, matches any part of the name. */
export const matchesQuery = (p: Product, term: string) =>
  p.title.toLowerCase().includes(term);

/** Pure: takes the catalogue in, returns the page to render. */
export function filterProducts(
  all: Product[],
  {
    category,
    band,
    sort = "featured",
    page = 1,
    q,
  }: {
    category?: string;
    band?: string;
    sort?: string;
    page?: number;
    /** Free-text product name search. Case-insensitive, matches part names. */
    q?: string;
  },
) {
  let list = [...all];

  const term = q?.trim().toLowerCase();
  if (term) list = list.filter((p) => matchesQuery(p, term));

  if (category) list = list.filter((p) => p.category === category);

  const range = priceBands.find((b) => b.slug === band);
  if (range) {
    list = list.filter((p) => {
      const from = startingPrice(p);
      return from >= range.min && from <= range.max;
    });
  }

  if (sort === "price-asc")
    list.sort((a, b) => startingPrice(a) - startingPrice(b));
  else if (sort === "price-desc")
    list.sort((a, b) => startingPrice(b) - startingPrice(a));
  // ponytail: "newest" is insertion order reversed — there is no addedAt field
  // yet. Add one and sort on it when the catalogue starts changing often.
  else if (sort === "newest") list.reverse();

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);

  return {
    items: list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    total,
    pages,
    page: current,
  };
}

/** Builds a /shop URL, dropping empty and default params. */
export function shopHref(params: {
  category?: string;
  band?: string;
  sort?: string;
  page?: number;
  q?: string;
}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.band) search.set("band", params.band);
  if (params.sort && params.sort !== "featured") search.set("sort", params.sort);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

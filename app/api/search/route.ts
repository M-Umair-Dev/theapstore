import { NextResponse } from "next/server";
import { matchesQuery, searchLimit } from "@/lib/catalogue";
import { needsChoice, startingPrice } from "@/lib/options";
import { listProducts } from "@/lib/repo";

/** Reads the catalogue per request — the header dropdown must never be stale. */
export const dynamic = "force-dynamic";

/**
 * Backs the header suggestion dropdown. Returns only what the dropdown draws,
 * so a keystroke never ships the whole catalogue to the browser.
 *
 * Lives here rather than in the page because the header is on every route.
 */
export async function GET(request: Request) {
  const term = (new URL(request.url).searchParams.get("q") ?? "")
    .trim()
    .toLowerCase();

  // One letter matches nearly everything and is not worth a query.
  if (term.length < 2) return NextResponse.json({ items: [] });

  const all = await listProducts();

  const items = all
    .filter((p) => matchesQuery(p, term))
    .slice(0, searchLimit)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      hasImage: Boolean(p.imageContentType),
      price: startingPrice(p),
      // A product the customer still has to choose options for is quoted as
      // "From", the same way its card is — the figure is the cheapest
      // combination, never a price for the product as listed.
      from: needsChoice(p),
    }));

  return NextResponse.json({ items });
}

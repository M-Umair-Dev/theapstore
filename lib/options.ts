/**
 * Pure helpers for products sold through the option matrix (duration × screens
 * × devices). Nothing here touches the database, so the product page, the cart
 * and the checkout can all use it.
 */
import type {
  OptionGroup,
  PriceRule,
  Product,
  Selection,
} from "./products.ts";

export const hasOptions = (p: Product) =>
  Boolean(p.optionGroups?.length && p.prices?.length);

export const pricedGroups = (p: Product): OptionGroup[] =>
  (p.optionGroups ?? []).filter((g) => g.priced);

const group = (p: Product, id: string) =>
  (p.optionGroups ?? []).find((g) => g.id === id);

const choice = (p: Product, groupId: string, choiceId: string) =>
  group(p, groupId)?.choices.find((c) => c.id === choiceId);

/** True when this group's hideWhen rule matches the current selection. */
export function isHidden(
  p: Product,
  selection: Selection,
  g: OptionGroup,
): boolean {
  const rule = g.hideWhen;
  if (!rule) return false;
  const current = selection[rule.groupId]?.[0];
  return Boolean(current && rule.choiceIds.includes(current));
}

/** Groups the customer should see, in order. */
export const visibleGroups = (p: Product, selection: Selection) =>
  (p.optionGroups ?? []).filter((g) => !isHidden(p, selection, g));

export const isVisible = (p: Product, selection: Selection, groupId: string) =>
  visibleGroups(p, selection).some((g) => g.id === groupId);

/**
 * Opens a product on its cheapest combination, filling any multi-select with
 * its first choice so the card can offer a one-tap Buy Now.
 */
export function defaultSelection(p: Product): Selection {
  if (!hasOptions(p)) return {};

  const cheapest = [...(p.prices ?? [])].sort((a, b) => a.price - b.price)[0];
  const selection: Selection = {};

  for (const g of p.optionGroups ?? []) {
    if (g.kind === "multi") continue;
    selection[g.id] = [cheapest?.values[g.id] ?? g.choices[0]?.id ?? ""];
  }

  for (const g of p.optionGroups ?? []) {
    if (g.kind !== "multi" || !isVisible(p, selection, g.id)) continue;

    // A device group has to be filled to the screen count, or the one-tap Buy
    // Now on the card would produce an order the checkout then rejects.
    const need = g.quantityFrom ? (requiredQuantity(p, selection, g) ?? 0) : 1;
    const first = g.choices[0]?.id;
    selection[g.id] = first ? Array.from({ length: need }, () => first) : [];
  }

  return selection;
}

/**
 * How many ticks a group currently holds, per choice. Unknown ids are dropped
 * so a hand-edited cart cannot inflate a count past the screen limit.
 */
export function countsOf(g: OptionGroup, ids: string[]) {
  const counts: Record<string, number> = {};
  for (const id of ids) {
    if (!g.choices.some((c) => c.id === id)) continue;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Ticks this group must total, taken from the group it depends on (the screen
 * package). Null when the group asks for nothing — unmapped choice, a rule
 * that wants zero, or no dependency at all.
 */
export function requiredQuantity(
  p: Product,
  selection: Selection,
  g: OptionGroup,
): number | null {
  const rule = g.quantityFrom;
  if (!rule) return null;
  const driver = selection[rule.groupId]?.[0];
  if (!driver) return 0;
  return rule.perChoice[driver] ?? 0;
}

/** Total ticks held across a group's choices. */
export const totalCount = (counts: Record<string, number>) =>
  Object.values(counts).reduce((sum, n) => sum + n, 0);

/** True when every visible group has the answers it needs. */
export function isComplete(p: Product, selection: Selection) {
  return visibleGroups(p, selection).every((g) => {
    const picked = (selection[g.id] ?? []).filter(Boolean);

    // A device group must add up to the screens that were bought.
    if (g.quantityFrom) {
      return totalCount(countsOf(g, picked)) === requiredQuantity(p, selection, g);
    }

    // A multi group needs at least one tick; a select group exactly one.
    return g.kind === "multi" ? picked.length >= 1 : picked.length === 1;
  });
}

/** Matches a selection against the price matrix. */
export function findPrice(
  p: Product,
  selection: Selection,
): PriceRule | undefined {
  const groups = pricedGroups(p);
  return (p.prices ?? []).find((rule) =>
    groups.every((g) => rule.values[g.id] === selection[g.id]?.[0]),
  );
}

/** What the customer pays for a complete selection. */
export function priceFor(p: Product, selection: Selection) {
  return findPrice(p, selection)?.price ?? 0;
}

/** Lowest price the product can be bought for. Works for both product shapes. */
export function startingPrice(p: Product) {
  if (!hasOptions(p)) {
    return p.plans.length ? Math.min(...p.plans.map((plan) => plan.price)) : 0;
  }
  return Math.min(...(p.prices ?? []).map((rule) => rule.price));
}

/** Stable id for the cart, unique per full selection. */
export function selectionId(p: Product, selection: Selection) {
  return (p.optionGroups ?? [])
    .map((g) => `${g.id}:${(selection[g.id] ?? []).join("+")}`)
    .join("|");
}

/** Reverses `selectionId`. The checkout re-prices from this, never from the
 *  browser's numbers. */
export function parseSelectionId(id: string): Selection {
  const selection: Selection = {};
  for (const part of id.split("|")) {
    const at = part.indexOf(":");
    if (at < 1) continue;
    selection[part.slice(0, at)] = part
      .slice(at + 1)
      .split("+")
      .filter(Boolean);
  }
  return selection;
}

/**
 * Splits a selection into the two lines the cart shows: the priced part
 * ("3 Months • 2 Screens") and the qualifier part ("Mobile / Laptop: 1, TV: 1").
 * A qualifier held more than once prints as a quantity; zero-valued choices are
 * left out entirely.
 */
export function describeSelection(p: Product, selection: Selection) {
  const part = (g: OptionGroup, joiner: string) =>
    (selection[g.id] ?? [])
      .filter(Boolean)
      .map((id) => choice(p, g.id, id)?.label ?? id)
      .join(joiner);

  const counted = (g: OptionGroup) =>
    Object.entries(countsOf(g, selection[g.id] ?? []))
      .map(([id, n]) => {
        const label = choice(p, g.id, id)?.label ?? id;
        return n > 1 ? `${label}: ${n}` : label;
      })
      .join(", ");

  const planName = pricedGroups(p)
    .map((g) => part(g, " + "))
    .filter(Boolean)
    .join(" • ");

  const meta = visibleGroups(p, selection)
    .filter((g) => !g.priced)
    .map((g) => (g.quantityFrom ? counted(g) : part(g, ", ")))
    .filter(Boolean)
    .join(" • ");

  return { planName, meta };
}

/** Every price-matrix cell, for the admin grid. */
export function priceMatrix(p: Product) {
  const groups = pricedGroups(p);
  let rows: Record<string, string>[] = [{}];

  for (const g of groups) {
    rows = rows.flatMap((row) =>
      g.choices.map((c) => ({ ...row, [g.id]: c.id })),
    );
  }

  return rows.map((values) => ({
    values,
    price: (p.prices ?? []).find((rule) =>
      groups.every((g) => rule.values[g.id] === values[g.id]),
    )?.price,
  }));
}

/* ---------------- cart lines ---------------- */

/** Shape the cart expects. Kept structural so this module stays dependency-free. */
export type CartLineInput = {
  slug: string;
  planId: string;
  title: string;
  planName: string;
  meta: string;
  price: number;
};

/** Turns a selection into a cart line. Handles both product shapes. */
export function lineFor(p: Product, selection: Selection): CartLineInput {
  if (!hasOptions(p)) {
    const plan = p.plans[0];
    return {
      slug: p.slug,
      planId: plan.id,
      title: p.title,
      planName: plan.name,
      meta: plan.meta.join(" • "),
      price: plan.price,
    };
  }

  const { planName, meta } = describeSelection(p, selection);
  return {
    slug: p.slug,
    planId: selectionId(p, selection),
    title: p.title,
    planName,
    meta,
    price: priceFor(p, selection),
  };
}

/** Cheapest combination, used by the card's one-tap Buy Now. */
export const defaultLine = (p: Product) => lineFor(p, defaultSelection(p));

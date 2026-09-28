/**
 * Pure helpers for products sold through the option matrix (duration × screens
 * × devices). Nothing here touches the database, so both the product page and
 * the cart can use it.
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

export const multiplierGroups = (p: Product): OptionGroup[] =>
  (p.optionGroups ?? []).filter((g) => g.multiplies);

export const slotGroups = (p: Product): OptionGroup[] =>
  (p.optionGroups ?? []).filter((g) => g.kind === "slots");

const group = (p: Product, id: string) =>
  (p.optionGroups ?? []).find((g) => g.id === id);

const choice = (p: Product, groupId: string, choiceId: string) =>
  group(p, groupId)?.choices.find((c) => c.id === choiceId);

/** How many device slots the current selection calls for. */
export function slotCount(p: Product, selection: Selection) {
  const slots = slotGroups(p)[0];
  if (!slots?.slotsFrom) return 0;

  const driver = selection[slots.slotsFrom]?.[0];
  return driver ? (choice(p, slots.slotsFrom, driver)?.count ?? 0) : 0;
}

/**
 * Opens a product's matrix on its cheapest combination, filling device slots
 * with the first choice so the card can offer a one-tap Buy Now.
 */
export function defaultSelection(p: Product): Selection {
  if (!hasOptions(p)) return {};

  const cheapest = [...(p.prices ?? [])].sort((a, b) => a.price - b.price)[0];
  const selection: Selection = {};

  // Two passes: the groups that decide the slot count must be answered before
  // the slot group is filled, whatever order the admin listed them in.
  for (const g of p.optionGroups ?? []) {
    if (g.kind !== "slots") {
      selection[g.id] = [cheapest?.values[g.id] ?? g.choices[0]?.id ?? ""];
    }
  }

  for (const g of p.optionGroups ?? []) {
    if (g.kind === "slots") {
      const count = slotCount(p, selection);
      selection[g.id] = Array.from(
        { length: count },
        () => g.choices[0]?.id ?? "",
      );
    }
  }

  return selection;
}

/** True when every group has the answers it needs. */
export function isComplete(p: Product, selection: Selection) {
  return (p.optionGroups ?? []).every((g) => {
    const picked = selection[g.id] ?? [];
    if (g.kind === "slots") {
      const needed = slotCount(p, selection);
      return needed > 0 && picked.length === needed && picked.every(Boolean);
    }
    return picked.length === 1 && Boolean(picked[0]);
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

/**
 * Multiplies the matrix price by the units of every multiplier group — 3 months
 * on a Rs. 549 screen costs 3 × 549.
 */
export function multiplierFor(p: Product, selection: Selection) {
  return multiplierGroups(p).reduce((product, g) => {
    const picked = g.choices.find((c) => c.id === selection[g.id]?.[0]);
    const units = picked?.count && picked.count > 0 ? picked.count : 1;
    return product * units;
  }, 1);
}

/** What the customer actually pays for a full selection. */
export function priceFor(p: Product, selection: Selection) {
  const rule = findPrice(p, selection);
  if (!rule) return 0;
  return rule.price * multiplierFor(p, selection);
}

/** Total if the customer picked a different choice in one group. */
export function priceWithChoice(
  p: Product,
  selection: Selection,
  groupId: string,
  choiceId: string,
) {
  return priceFor(p, { ...selection, [groupId]: [choiceId] });
}

/**
 * Cheapest price available with a given choice in a priced group — the
 * "From Rs. X" shown beside each option.
 */
export function cheapestWithChoice(
  p: Product,
  groupId: string,
  choiceId: string,
) {
  const matching = (p.prices ?? []).filter(
    (rule) => rule.values[groupId] === choiceId,
  );
  return matching.length
    ? Math.min(...matching.map((rule) => rule.price))
    : undefined;
}

/** Lowest price the product can be bought for. Works for both product shapes. */
export function startingPrice(p: Product) {
  if (!hasOptions(p)) {
    return p.plans.length ? Math.min(...p.plans.map((plan) => plan.price)) : 0;
  }

  const floor = multiplierGroups(p).reduce((product, g) => {
    const units = g.choices
      .map((c) => c.count)
      .filter((n): n is number => typeof n === "number" && n > 0);
    return product * (units.length ? Math.min(...units) : 1);
  }, 1);

  return Math.min(...(p.prices ?? []).map((rule) => rule.price)) * floor;
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
 * ("3 Months • 2 Screens") and the qualifier part ("Mobile/Laptop + TV").
 */
export function describeSelection(p: Product, selection: Selection) {
  const part = (g: OptionGroup) =>
    (selection[g.id] ?? [])
      .map((id) => choice(p, g.id, id)?.label ?? id)
      .join(" + ");

  const planName = [...multiplierGroups(p), ...pricedGroups(p)]
    .map(part)
    .filter(Boolean)
    .join(" • ");

  const meta = (p.optionGroups ?? [])
    .filter((g) => !g.priced && !g.multiplies)
    .map(part)
    .filter(Boolean)
    .join(" • ");

  return { planName, meta };
}

/** Every price-matrix cell, for the admin grid. */export function priceMatrix(p: Product) {
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

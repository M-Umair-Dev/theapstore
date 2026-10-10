"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { formatPrice } from "./products";
import { isDeliveryMethod, type DeliveryMethod } from "./order-status";

/**
 * Lines snapshot the title, plan and price at the moment they were added, so
 * the cart needs no database round trip and stays usable offline. Re-check the
 * price server-side when the order is placed.
 */
export type CartLine = {
  slug: string;
  planId: string;
  title: string;
  planName: string;
  meta: string;
  price: number;
  qty: number;
};

export type NewLine = Omit<CartLine, "qty">;

type CartValue = {
  lines: CartLine[];
  /** False until localStorage has been read — avoids a flash of "0". */
  ready: boolean;
  count: number;
  add: (line: NewLine, qty?: number) => void;
  setQty: (slug: string, planId: string, qty: number) => void;
  remove: (slug: string, planId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);
const STORAGE_KEY = "theapstore.cart";

/**
 * Cart lines are snapshots, and the shape has changed since the first version.
 * Anything already sitting in a visitor's localStorage has to be checked before
 * it reaches a render — a line missing `title` or `price` crashes on
 * `title.charAt` and prints "Rs. NaN".
 */
function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const l = value as Partial<CartLine>;
  return (
    typeof l.slug === "string" &&
    l.slug.length > 0 &&
    typeof l.planId === "string" &&
    l.planId.length > 0 &&
    typeof l.title === "string" &&
    l.title.length > 0 &&
    typeof l.planName === "string" &&
    typeof l.meta === "string" &&
    typeof l.price === "number" &&
    Number.isFinite(l.price) &&
    typeof l.qty === "number" &&
    Number.isFinite(l.qty) &&
    l.qty >= 1
  );
}

/** Parses stored JSON, dropping anything that no longer fits the shape. */
function readStoredCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCartLine) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(readStoredCart(localStorage.getItem(STORAGE_KEY)));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  // Keep one tab's cart in sync when another tab changes it.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setLines(readStoredCart(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((line: NewLine, qty = 1) => {
    setLines((prev) => {
      const at = prev.findIndex(
        (l) => l.slug === line.slug && l.planId === line.planId,
      );
      if (at === -1) return [...prev, { ...line, qty }];
      const next = [...prev];
      next[at] = { ...next[at], qty: next[at].qty + qty };
      return next;
    });
  }, []);

  const setQty = useCallback((slug: string, planId: string, qty: number) => {
    setLines((prev) =>
      qty < 1
        ? prev.filter((l) => !(l.slug === slug && l.planId === planId))
        : prev.map((l) =>
            l.slug === slug && l.planId === planId ? { ...l, qty } : l,
          ),
    );
  }, []);

  const remove = useCallback((slug: string, planId: string) => {
    setLines((prev) =>
      prev.filter((l) => !(l.slug === slug && l.planId === planId)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = lines.reduce((n, l) => n + l.qty, 0);

  const value = useMemo(
    () => ({ lines, ready, count, add, setQty, remove, clear }),
    [lines, ready, count, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.price * l.qty, 0);

export const formatTotal = (lines: CartLine[]) => formatPrice(cartTotal(lines));

/* ---------------- delivery preference ---------------- */

const DELIVERY_KEY = "theapstore.delivery";

/**
 * Carries the customer's choice from the cart to the checkout form. This is a
 * convenience only — the order itself stores the method, and a missing or
 * tampered value here just means the checkout starts with nothing selected.
 */
export function readDelivery(): DeliveryMethod | "" {
  try {
    const raw = localStorage.getItem(DELIVERY_KEY);
    return isDeliveryMethod(raw) ? raw : "";
  } catch {
    // Private mode, blocked storage — the checkbox just starts empty.
    return "";
  }
}

export function writeDelivery(method: DeliveryMethod) {
  try {
    localStorage.setItem(DELIVERY_KEY, method);
  } catch {
    // Not worth surfacing: the checkout still collects the choice.
  }
}

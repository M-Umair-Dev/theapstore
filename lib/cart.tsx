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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // Corrupt or blocked storage — start empty rather than crash.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  // Keep one tab's cart in sync when another tab changes it.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        setLines(JSON.parse(e.newValue));
      } catch {
        /* ignore */
      }
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

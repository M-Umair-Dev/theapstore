"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { shopHref, type Sort } from "@/lib/catalogue";
import { formatPrice } from "@/lib/products";

type Suggestion = {
  slug: string;
  title: string;
  hasImage: boolean;
  price: number;
  from: boolean;
};

/** Wait this long after the last keystroke before asking the server. */
const TYPING_PAUSE = 220;

/** Suggestions appear from this length up — one letter matches everything. */
const MIN_TERM = 2;

type Props = {
  /** Current term, so the box reflects the URL it landed on. */
  initial?: string;
  /**
   * Shop page mode: every keystroke re-runs the search on the server and the
   * results below update. The header leaves this off and shows a dropdown
   * instead, because there is no list underneath to update.
   */
  live?: boolean;
  /** Filters to carry through in live mode, so searching never drops them. */
  base?: { category?: string; band?: string; sort?: Sort };
};

export default function SearchBox({ initial = "", live, base }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  /** The last term this box handed to the URL, so the sync below can tell an
   *  outside change (Clear search) from the echo of our own replace. */
  const sent = useRef(initial ?? "");

  const term = value.trim();
  // `base` is rebuilt on every render by the caller, so the effect keys on its
  // contents instead of its identity.
  const baseKey = JSON.stringify(base ?? {});

  /* ---- accept a term that changed underneath us, without eating keystrokes ---- */
  useEffect(() => {
    const next = initial ?? "";
    if (next === sent.current) return;
    sent.current = next;
    setValue(next);
  }, [initial]);

  /* ---- live mode: re-run the shop search as the customer types ---- */
  useEffect(() => {
    if (!live || value.trim() === sent.current.trim()) return;

    const id = setTimeout(() => {
      const filters = JSON.parse(baseKey) as Props["base"];
      const next = value.trim();
      sent.current = next;
      router.replace(shopHref({ ...filters, q: next || undefined }));
    }, TYPING_PAUSE);

    return () => clearTimeout(id);
  }, [value, live, baseKey, router]);

  /* ---- header mode: fetch the suggestions ---- */
  useEffect(() => {
    if (live || term.length < MIN_TERM) {
      setItems([]);
      return;
    }

    // Each keystroke cancels the one before it, so a slow early response can
    // never land on top of a newer one.
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: Suggestion[] };
        setItems(data.items ?? []);
      } catch {
        // Aborted or offline — the previous list stays, which is harmless.
      }
    }, TYPING_PAUSE);

    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [term, live]);

  /* ---- close on outside click and on Escape ---- */
  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const goToShop = () => {
    setOpen(false);
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
  };

  const showDrop = open && !live && term.length >= MIN_TERM;

  return (
    <div className="search-box" ref={box}>
      <form
        className="search-form"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goToShop();
        }}
      >
        <input
          type="search"
          name="q"
          className="search-input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search products"
          aria-label="Search products by name"
          aria-expanded={showDrop}
          autoComplete="off"
        />
        <button type="submit" className="search-btn" aria-label="Search">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.6-3.6" />
          </svg>
        </button>
      </form>

      {showDrop && (
        <div className="search-drop">
          {items.length === 0 ? (
            <p className="search-empty">No matching products found</p>
          ) : (
            <ul className="search-list">
              {items.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/product/${item.slug}`}
                    className="search-hit"
                    onClick={() => setOpen(false)}
                  >
                    {item.hasImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/image/${item.slug}`}
                        alt=""
                        className="search-thumb"
                      />
                    ) : (
                      <span className="search-thumb" aria-hidden="true">
                        {item.title.charAt(0)}
                      </span>
                    )}
                    <span className="search-hit-text">
                      <span className="search-hit-name">{item.title}</span>
                      <span className="search-hit-price">
                        {item.from ? "From " : ""}
                        {formatPrice(item.price)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <button type="button" className="search-all" onClick={goToShop}>
            View all results for “{term}”
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SearchBox from "@/components/SearchBox";

/**
 * Mobile-only search. The full field takes too much of a 320px header, so it
 * moves behind an icon and opens as a panel under the header.
 *
 * Closes on Escape, on the close button, and after navigating — submitting a
 * search pushes /shop?q=…, which changes the path and closes the panel.
 */
export default function MobileSearch() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="icon-btn mobile-search-toggle"
        aria-label="Search products"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.6-3.6" />
        </svg>
      </button>

      {open && (
        <div className="mobile-search-panel" role="search">
          <SearchBox />
          <button
            type="button"
            className="icon-btn"
            aria-label="Close search"
            onClick={() => setOpen(false)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Product name search. Submitting hands the term to /shop as a `q` parameter,
 * so the result page is a shareable URL and the shop keeps its own filtering,
 * sorting and paging. Works from any page because the header renders it.
 *
 * Submission only — filtering against the catalogue happens on the server, so
 * a keystroke never costs a request.
 */
export default function SearchBox({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  return (
    <form
      className="search-box"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const term = value.trim();
        router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
      }}
    >
      <input
        type="search"
        name="q"
        className="search-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products"
        aria-label="Search products by name"
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
  );
}

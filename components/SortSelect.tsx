"use client";

import { useRouter } from "next/navigation";
import { shopHref, sorts, type Sort } from "@/lib/catalogue";

export default function SortSelect({
  sort,
  category,
  band,
  q,
}: {
  sort: Sort;
  category?: string;
  band?: string;
  /** Active search term, carried so sorting never drops it. */
  q?: string;
}) {
  const router = useRouter();

  return (
    <label className="result-count">
      Sort{" "}
      <select
        className="select"
        value={sort}
        onChange={(e) =>
          router.push(
            shopHref({ category, band, sort: e.target.value as Sort, q }),
          )
        }
      >
        {Object.entries(sorts).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

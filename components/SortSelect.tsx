"use client";

import { useRouter } from "next/navigation";
import { shopHref, sorts, type Sort } from "@/lib/catalogue";

export default function SortSelect({
  sort,
  category,
  band,
}: {
  sort: Sort;
  category?: string;
  band?: string;
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
            shopHref({ category, band, sort: e.target.value as Sort }),
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

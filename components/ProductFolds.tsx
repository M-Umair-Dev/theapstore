"use client";

import { useEffect, useRef } from "react";

/**
 * The product page sections are native details elements. This keeps one open
 * at a time, starts on the first section, and still lets that section close.
 * resetKey is the product slug so a new product starts on Key Features again.
 */
export default function ProductFolds({
  resetKey,
  children,
}: {
  resetKey: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const folds = () =>
      [...root.querySelectorAll<HTMLDetailsElement>("details.pd-fold")];

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const current = target.closest("summary")?.closest("details");
      if (
        !(current instanceof HTMLDetailsElement) ||
        !current.classList.contains("pd-fold") ||
        !root.contains(current) ||
        current.open
      ) {
        return;
      }
      // The heading click opens this section after the click event. Close the
      // others first so only one section stays open. An already-open heading
      // is left to close on its own.
      for (const fold of folds()) {
        if (fold !== current) fold.open = false;
      }
    };

    root.addEventListener("click", onClick);
    folds().forEach((fold, index) => {
      fold.open = index === 0;
    });

    return () => root.removeEventListener("click", onClick);
  }, [resetKey]);

  return <div ref={ref}>{children}</div>;
}

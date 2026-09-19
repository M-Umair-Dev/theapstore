"use client";

import { explainError } from "@/lib/errors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container" style={{ paddingBlock: "var(--space-8)" }}>
      <div className="empty-state">
        <h2>Something went wrong</h2>
        <p>{explainError(error)}</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn-primary" onClick={reset}>
            Try again
          </button>
        </div>
        {error.digest && (
          <p className="hint" style={{ marginTop: "var(--space-5)" }}>
            Reference {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

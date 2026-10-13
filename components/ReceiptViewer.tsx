"use client";

import { useEffect, useState } from "react";

/**
 * Payment screenshots used to open as a bare image in a new browser tab, which
 * left the admin with no way back except the browser's own controls. This opens
 * the full-size image in place, with a close button, Escape, and a backdrop
 * click to dismiss.
 *
 * The image still comes from /api/receipt/<reference>, which is admin-only.
 */
export default function ReceiptViewer({
  reference,
}: {
  reference: string;
}) {
  const [open, setOpen] = useState(false);
  const src = `/api/receipt/${reference}`;

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    // Stop the order list scrolling behind the overlay.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="receipt-thumb"
        onClick={() => setOpen(true)}
        aria-label={`Open the payment screenshot for ${reference}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`Payment screenshot for ${reference}`} />
      </button>
      <p className="hint">Click to open full size.</p>

      {open && (
        <div
          className="receipt-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Payment screenshot for ${reference}`}
          onClick={() => setOpen(false)}
        >
          <div
            className="receipt-modal-body"
            // Clicks inside the image must not close it.
            onClick={(e) => e.stopPropagation()}
          >
            <div className="receipt-modal-head">
              <span>Payment screenshot · {reference}</span>
              <div className="receipt-modal-actions">
                <a
                  className="btn btn-secondary btn-sm"
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setOpen(false)}
                  autoFocus
                >
                  Close
                </button>
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Payment screenshot for ${reference}`} />
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import {
  paymentCatalogue,
  paymentInitials,
  type PaymentMethodConfig,
} from "@/lib/payments";

/**
 * Payment choices at checkout. Only the methods the admin left both enabled and
 * visible arrive here — the server filtered them before render, and it checks
 * again when the order is placed.
 *
 * Logos: each method uses the official asset from `public/payments/` when one
 * is present. When it is not, the fallback is the brand's initials in a plain
 * chip — never a hand-drawn imitation of the mark, which would be a wrong logo
 * rather than a missing one.
 */
function MethodIcon({ id, logo }: { id: PaymentMethodConfig["id"]; logo?: string | null }) {
  if (logo) {
    // A plain img: these are local files of known size, so next/image would add
    // a loader and layout maths for no benefit.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        className="pay-logo"
        src={logo}
        alt={`${paymentCatalogue[id].label} logo`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  // A bank with no specific bank configured keeps the building glyph.
  if (paymentCatalogue[id].kind === "bank") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 10h18M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 18h18M12 3l9 5H3l9-5z" />
      </svg>
    );
  }

  if (paymentCatalogue[id].kind === "crypto") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9.5 9.8h4a1.7 1.7 0 010 3.4h-4M9.5 13.2h4.3a1.7 1.7 0 010 3.4H9.5" />
      </svg>
    );
  }

  return (
    <span className="pay-monogram" aria-hidden="true">
      {paymentInitials[id]}
    </span>
  );
}

/** One line of the selected method's account information. */
function Detail({
  label,
  value,
  copyable,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  return (
    <div className="pay-detail">
      <span className="pay-detail-label">{label}</span>
      <span className="pay-detail-value">{value}</span>
      {copyable && (
        <button
          type="button"
          className="copy-btn"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              // Clipboard blocked — the number is on screen to read.
            }
          }}
        >
          {copied ? "Copied" : `Copy ${label}`}
        </button>
      )}
    </div>
  );
}

export default function PaymentPicker({
  methods,
  logos = {},
}: {
  methods: PaymentMethodConfig[];
  /** method id → public path of its logo, or null when no asset is present. */
  logos?: Record<string, string | null>;
}) {
  const [selected, setSelected] = useState<PaymentMethodConfig["id"] | "">("");

  if (methods.length === 0) {
    return (
      <p className="form-error" role="alert">
        No payment method is available at the moment, so orders cannot be placed
        right now. Please contact us and we will take your order directly.
      </p>
    );
  }

  const active = methods.find((m) => m.id === selected);

  return (
    <fieldset className="delivery-pick">
      <legend>How would you like to pay?</legend>

      <div className="delivery-options">
        {methods.map((method) => (
          <label className="delivery-card" key={method.id}>
            <input
              type="radio"
              name="method"
              value={method.id}
              checked={selected === method.id}
              onChange={() => setSelected(method.id)}
              required
            />
            <span className="pay-card-body">
              <span className="pay-card-head">
                <MethodIcon id={method.id} logo={logos[method.id]} />
                <span className="delivery-name">
                  {paymentCatalogue[method.id].label}
                </span>
              </span>
              <span className="delivery-note">{method.accountTitle}</span>
            </span>
          </label>
        ))}
      </div>

      {active ? (
        <div className="pay-panel">
          <p className="stat-label">
            Send your payment to this{" "}
            {active.id === "crypto"
              ? `${active.asset ?? "crypto"} ${active.network ?? ""}`.trim()
              : paymentCatalogue[active.id].label}{" "}
            account
          </p>

          {active.id === "crypto" && (
            <>
              <Detail label="Coin" value={active.asset ?? ""} />
              <Detail label="Network" value={active.network ?? ""} />
              <Detail
                label="Wallet address"
                value={active.accountNumber}
                copyable
              />
              <p className="pay-warning">
                Send <strong>{active.asset}</strong> on{" "}
                <strong>{active.network}</strong> only. Coins sent on any other
                network are lost and cannot be recovered.
              </p>
            </>
          )}

          {active.bankName && <Detail label="Bank" value={active.bankName} />}
          {active.id !== "crypto" && (
            <Detail
              label="Account title"
              value={active.accountTitle}
              copyable
            />
          )}
          {active.id !== "crypto" && (
            <Detail
              label={active.id === "bank_transfer" ? "Account number" : "Number"}
              value={active.accountNumber}
              copyable
            />
          )}
          {active.iban && <Detail label="IBAN" value={active.iban} copyable />}
          {active.branch && <Detail label="Branch" value={active.branch} />}

          {active.instructions && (
            <p className="helper-text">{active.instructions}</p>
          )}

          <p className="helper-text">
            Pay the total, then upload the confirmation screenshot below. We
            check it against your order before delivering.
          </p>
        </div>
      ) : (
        <p className="helper-text">
          Choose a method and the account details to pay into will appear here.
        </p>
      )}
    </fieldset>
  );
}

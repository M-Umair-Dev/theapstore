"use client";

import { useState } from "react";

/**
 * Copies the account details out of the fulfilment form so the admin can paste
 * them into WhatsApp. Reading the fields by id keeps the password out of the
 * markup here and out of every URL.
 */
export default function CopyDetails({
  formId,
  label = "Copy details",
}: {
  /** id of the form holding the credential fields. */
  formId: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={async () => {
        const form = document.getElementById(formId);
        if (!(form instanceof HTMLFormElement)) return;

        const read = (name: string) => {
          const field = form.elements.namedItem(name);
          return field instanceof HTMLInputElement ||
            field instanceof HTMLTextAreaElement
            ? field.value.trim()
            : "";
        };

        const lines = [
          `Order ${read("reference")}`,
          read("username") && `Username: ${read("username")}`,
          read("password") && `Password: ${read("password")}`,
          read("duration") && `Valid for: ${read("duration")}`,
          read("instructions") && `\n${read("instructions")}`,
          read("notes") && `\nNotes: ${read("notes")}`,
        ].filter(Boolean);

        if (lines.length <= 1) return;

        try {
          await navigator.clipboard.writeText(lines.join("\n"));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked (insecure origin or denied permission). The admin
          // can still select the fields by hand.
        }
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

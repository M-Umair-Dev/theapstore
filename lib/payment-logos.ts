import { existsSync } from "node:fs";
import path from "node:path";
import {
  logoFileNames,
  paymentMethodIds,
  type PaymentMethodId,
} from "./payments.ts";

/**
 * Finds a logo file for each payment method.
 *
 * Server-only — it touches the filesystem. The result is handed to the checkout
 * as a plain string map so the client component never guesses whether a file
 * exists and never renders a broken image.
 *
 * Drop assets into `public/payments/` named after the method id:
 *   public/payments/easypaisa.svg
 *   public/payments/jazzcash.png
 * See public/payments/README.md.
 */

const LOGO_DIR = path.join(process.cwd(), "public", "payments");

/** Five stats per process, not per render. */
let cache: Map<PaymentMethodId, string | null> | null = null;

function build() {
  const found = new Map<PaymentMethodId, string | null>();
  for (const id of paymentMethodIds) {
    const hit = logoFileNames(id).find((name) =>
      existsSync(path.join(LOGO_DIR, name)),
    );
    found.set(id, hit ? `/payments/${hit}` : null);
  }
  return found;
}

export function resolvePaymentLogos(): Record<string, string | null> {
  cache ??= build();
  return Object.fromEntries(cache);
}

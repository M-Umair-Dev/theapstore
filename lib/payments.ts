/**
 * Payment method catalogue.
 *
 * The identifiers and labels are fixed here — an order stores the id, and the
 * label is denormalised onto the order so a renamed method never rewrites
 * history. Everything an admin can edit (account title, numbers, instructions,
 * enabled, visible) lives in the database, not in this file.
 *
 * Client-safe: the checkout reads this too.
 */

export type PaymentMethodId =
  | "easypaisa"
  | "jazzcash"
  | "sadapay"
  | "nayapay"
  | "bank_transfer"
  | "crypto";

export type PaymentKind = "wallet" | "bank" | "crypto";

export const paymentMethodIds: PaymentMethodId[] = [
  "easypaisa",
  "jazzcash",
  "sadapay",
  "nayapay",
  "bank_transfer",
  "crypto",
];

export const paymentCatalogue: Record<
  PaymentMethodId,
  { label: string; kind: PaymentKind }
> = {
  easypaisa: { label: "EasyPaisa", kind: "wallet" },
  jazzcash: { label: "JazzCash", kind: "wallet" },
  sadapay: { label: "SadaPay", kind: "wallet" },
  nayapay: { label: "NayaPay", kind: "wallet" },
  bank_transfer: { label: "Bank Transfer", kind: "bank" },
  crypto: { label: "Crypto Payment", kind: "crypto" },
};

export const isPaymentMethodId = (v: unknown): v is PaymentMethodId =>
  typeof v === "string" && paymentMethodIds.includes(v as PaymentMethodId);

export const paymentLabel = (id: PaymentMethodId) =>
  paymentCatalogue[id].label;

/**
 * One method's configuration. `accountNumber` carries the mobile number for a
 * wallet and the account number for a bank; `iban` and `branch` only apply to
 * the bank.
 */
export type PaymentMethodConfig = {
  id: PaymentMethodId;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  iban?: string;
  branch?: string;
  /** Crypto only: the coin, e.g. "USDT". */
  asset?: string;
  /** Crypto only: the chain, e.g. "TRC20 (TRON)". Never optional in the UI —
   *  USDT on TRC20 and USDT on ERC20 are not the same destination. */
  network?: string;
  instructions?: string;
  /** Can be chosen for a new order. */
  enabled: boolean;
  /** Shown to customers at all. */
  visible: boolean;
};

export type PaymentSettings = {
  methods: PaymentMethodConfig[];
  updatedAt?: Date;
};

/**
 * True while the wallet is still the seeded placeholder. A crypto method with
 * one of these must never reach a customer — a wrong address is money burned.
 */
export const isPlaceholderWallet = (address: string) => {
  const value = address.trim();
  if (!value) return true;
  return (
    /replace|your.?wallet|placeholder|example|xxx+/i.test(value) ||
    value.replace(/\D/g, "").length === 0
  );
};

/** A method customers may actually pick: both switches on, and for crypto a
 *  wallet address that is not the placeholder. */
export const isAvailable = (m: PaymentMethodConfig) =>
  m.enabled &&
  m.visible &&
  (m.id !== "crypto" || !isPlaceholderWallet(m.accountNumber));

/**
 * Placeholders so the checkout can be exercised before the real accounts are
 * entered. Every value says "Demo" so nobody mistakes them for live details.
 */
export const demoPaymentMethods = (): PaymentMethodConfig[] => [
  {
    id: "easypaisa",
    accountTitle: "Demo EasyPaisa Account",
    accountNumber: "0300-0000000",
    instructions: "Demo details — replace these with your real account before going live.",
    enabled: true,
    visible: true,
  },
  {
    id: "jazzcash",
    accountTitle: "Demo JazzCash Account",
    accountNumber: "0300-0000000",
    instructions: "Demo details — replace these with your real account before going live.",
    enabled: true,
    visible: true,
  },
  {
    id: "sadapay",
    accountTitle: "Demo SadaPay Account",
    accountNumber: "0000000000",
    instructions: "Demo details — replace these with your real account before going live.",
    enabled: true,
    visible: true,
  },
  {
    id: "nayapay",
    accountTitle: "Demo NayaPay Account",
    accountNumber: "0000000000",
    instructions: "Demo details — replace these with your real account before going live.",
    enabled: true,
    visible: true,
  },
  {
    id: "bank_transfer",
    accountTitle: "Demo Account Holder",
    accountNumber: "000000000000",
    bankName: "Demo Bank",
    iban: "PK00DEMO0000000000000000",
    branch: "Demo Branch",
    instructions: "Demo details — replace these with your real account before going live.",
    enabled: true,
    visible: true,
  },
  // Shipped switched off, and the wallet is a placeholder. It stays invisible at
  // checkout until an admin enters a real TRC20 address.
  {
    id: "crypto",
    accountTitle: "Demo Crypto Wallet",
    accountNumber: "REPLACE-WITH-YOUR-TRC20-WALLET-ADDRESS",
    asset: "USDT",
    network: "TRC20 (TRON)",
    instructions:
      "Send only USDT on the TRC20 network. Another network will lose the funds.",
    enabled: false,
    visible: false,
  },
];

/** True while any placeholder value is still in place. */
export const looksLikeDemo = (m: PaymentMethodConfig) =>
  /\bdemo\b|^0{6,}$|^0300-0{7}$|^PK00DEMO/i.test(
    [m.accountTitle, m.accountNumber, m.bankName, m.iban].filter(Boolean).join(" "),
  ) || (m.id === "crypto" && isPlaceholderWallet(m.accountNumber));

/* ---------------- logos ---------------- */

/**
 * Where an official logo is looked for, in order. Files live in
 * `public/payments/` so nothing depends on a third party's CDN staying up or
 * keeping the same URL.
 */
export const logoFileNames = (id: PaymentMethodId) => [
  `${id}.svg`,
  `${id}.png`,
  `${id}.webp`,
];

/** Shown when no logo file is present. Letters, not a drawn mark — a
 *  hand-drawn approximation of a brand is worse than an honest placeholder. */
export const paymentInitials: Record<PaymentMethodId, string> = {
  easypaisa: "EP",
  jazzcash: "JC",
  sadapay: "SP",
  nayapay: "NP",
  bank_transfer: "Bank",
  crypto: "USDT",
};

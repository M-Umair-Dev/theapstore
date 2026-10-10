/**
 * Single source of brand/config truth.
 * Swap these values to rebrand the whole store.
 */
export const site = {
  name: "TheApStore",
  tagline: "Digital Store",
  description:
    "A modern digital store providing digital subscriptions, tools and online services.",
  since: 2020,
  /**
   * Store contact address, shown on the Contact page and in the order
   * instructions. Override with NEXT_PUBLIC_STORE_EMAIL — it must be prefixed
   * NEXT_PUBLIC_ because the header and footer read it in the browser.
   */
  email: process.env.NEXT_PUBLIC_STORE_EMAIL ?? "elitestfashion@gmail.com",
  /** E.164 without "+". Leave empty to hide every WhatsApp action. */
  whatsapp: "923404000618",
  /** Display form, shown to customers. */
  whatsappDisplay: "+92 340 4000618",
  /**
   * Digits to prepend to a local `0…` number when building a wa.me link for an
   * order. Only used for that shape — an already-international number is left
   * exactly as the customer gave it.
   */
  whatsappCountryCode: "92",
  social: {
    linkedin: "https://linkedin.com",
    instagram: "https://instagram.com",
    x: "https://x.com",
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/categories", label: "Categories" },
    { href: "/track", label: "Track Order" },
    { href: "/reviews", label: "Reviews" },
    { href: "/about", label: "About Us" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ],
  footer: [
    {
      title: "Shop",
      links: [
        { href: "/shop", label: "All Products" },
        { href: "/categories", label: "Categories" },
        { href: "/track", label: "Track Order" },
        { href: "/reviews", label: "Reviews" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/about", label: "About Us" },
        { href: "/blog", label: "Blog" },
        { href: "/contact", label: "Contact" },
      ],
    },
    {
      title: "Support",
      links: [
        { href: "/faq", label: "FAQ" },
        { href: "/contact", label: "Contact Us" },
        { href: "/delivery-policy", label: "Delivery Policy" },
        { href: "/returns-exchange", label: "Returns / Exchange" },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/privacy-policy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms & Conditions" },
        { href: "/refund-policy", label: "Refund / Replacement" },
      ],
    },
  ],
} as const;

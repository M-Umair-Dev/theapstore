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
  email: "hello@theapstore.com",
  /** E.164 without "+". Leave empty to hide every WhatsApp action. */
  whatsapp: "923051257000",
  /** Display form, shown to customers. */
  whatsappDisplay: "+92 305 1257000",
  social: {
    linkedin: "https://linkedin.com",
    instagram: "https://instagram.com",
    x: "https://x.com",
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/categories", label: "Categories" },
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

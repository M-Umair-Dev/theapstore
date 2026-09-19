import { site } from "./site";

type Section = { heading: string; body: string[] };

export const legalPages: Record<
  string,
  { title: string; intro: string; sections: Section[] }
> = {
  faq: {
    title: "Frequently Asked Questions",
    intro:
      "Short answers to the questions we get asked most about ordering, delivery and warranty.",
    sections: [
      {
        heading: "How do I receive my order?",
        body: [
          "Once payment is confirmed, we send your access details by email or WhatsApp. Most orders are delivered within 30 minutes during business hours.",
        ],
      },
      {
        heading: "How does the warranty work?",
        body: [
          "Every plan carries the warranty shown on its product page. If your access stops working inside that window, contact us and we replace it at no cost.",
          "The warranty covers access problems only. It does not cover a change of mind, or damage caused by altering account settings against the access guidelines.",
        ],
      },
      {
        heading: "Which payment methods do you accept?",
        body: [
          "Bank transfer, Easypaisa and JazzCash. After placing your order you upload the payment screenshot and we verify it before delivery.",
        ],
      },
      {
        heading: "Can I use a shared plan on my own profile?",
        body: [
          "Yes. Shared plans give you a private profile inside an account we manage. Your viewing history and recommendations stay yours.",
        ],
      },
      {
        heading: "What if a plan is out of stock?",
        body: [
          "Products marked Coming Soon are restocking. Contact us and we will tell you when the next batch lands.",
        ],
      },
    ],
  },
  "delivery-policy": {
    title: "Delivery Policy",
    intro:
      "Every product in this store is digital. Nothing ships physically, so delivery means handing over your access.",
    sections: [
      {
        heading: "Delivery time",
        body: [
          "Orders placed during business hours are usually delivered within 15 to 60 minutes of payment verification.",
          "Orders placed overnight are delivered the next morning.",
        ],
      },
      {
        heading: "How delivery happens",
        body: [
          "We send credentials, an invitation link, or an upgrade applied to your own account — depending on what the plan uses.",
          "You will receive delivery instructions along with the access details. Follow them exactly to keep the warranty valid.",
        ],
      },
      {
        heading: "If delivery is late",
        body: [
          "Contact us with your order number. If we cannot deliver, you get a full refund — no questions asked.",
        ],
      },
    ],
  },
  "returns-exchange": {
    title: "Returns & Exchange",
    intro:
      "Digital access cannot be handed back once it is delivered, so we handle problems through replacement instead.",
    sections: [
      {
        heading: "Replacement",
        body: [
          "If your access fails within the warranty window, we replace it free of charge. That is the exchange path for every digital plan.",
        ],
      },
      {
        heading: "When replacement is not available",
        body: [
          "If we cannot restore or replace your access, we refund the unused portion of your plan.",
        ],
      },
      {
        heading: "What voids a replacement",
        body: [
          "Changing passwords, recovery details, billing or security settings against the access guidelines voids the warranty on that plan.",
          "Exceeding the number of users, profiles, screens or devices included in your plan also voids it.",
        ],
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    intro: `How ${site.name} handles the information you give us.`,
    sections: [
      {
        heading: "What we collect",
        body: [
          "Your name, contact details and order information. If you upload a payment screenshot, we keep it only to verify the payment.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "To deliver your order, provide warranty support, and respond when you contact us. Nothing else.",
        ],
      },
      {
        heading: "Sharing",
        body: [
          "We do not sell your information. We share it only where a supplier needs it to activate your access.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          `Ask us to delete your order history at any time by writing to ${site.email}.`,
        ],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: `The rules that apply when you buy from ${site.name}.`,
    sections: [
      {
        heading: "Orders",
        body: [
          "An order is confirmed once payment is verified. We may cancel an order and refund it in full if we cannot fulfil it.",
        ],
      },
      {
        heading: "Access and account guidelines",
        body: [
          "Use only the access type stated on your plan.",
          "Do not alter passwords, recovery information, billing or security settings unless the delivery instructions tell you to.",
          "Do not exceed the users, profiles, screens or devices included in your plan.",
          "Keep your credentials private. Contact support before making major changes to an account.",
          "Product-specific terms override these general guidelines where they differ.",
        ],
      },
      {
        heading: "Independence",
        body: [
          `${site.name} is an independent digital store. Product names, logos and trademarks belong to their respective owners and are used only to describe the services offered.`,
        ],
      },
    ],
  },
  "refund-policy": {
    title: "Refund & Replacement",
    intro:
      "We would rather fix your access than keep your money. Here is how that works.",
    sections: [
      {
        heading: "Before delivery",
        body: [
          "Cancel any time before we deliver and you get a full refund.",
        ],
      },
      {
        heading: "After delivery",
        body: [
          "If your access fails within the warranty window, we replace it. If we cannot replace it, we refund the unused portion of the plan.",
        ],
      },
      {
        heading: "How refunds are paid",
        body: [
          "Refunds go back through the same payment method you used, within 3 to 5 business days of approval.",
        ],
      },
    ],
  },
};

export const reviews = [
  {
    author: "Hamza R.",
    product: "Netflix Premium Subscription",
    rating: 5,
    body: "Ordered the dual-screen plan at midnight and had the profile by morning. No buffering, no drama — exactly what was promised.",
  },
  {
    author: "Ayesha K.",
    product: "Canva Pro",
    rating: 5,
    body: "Upgraded my own account, so all my designs stayed. Support answered on WhatsApp within a couple of minutes.",
  },
  {
    author: "Bilal A.",
    product: "IPTV — Live TV 4K",
    rating: 4,
    body: "Channel list is huge and the sports streams hold up well. Took me a few minutes to set up the EPG, but the guide they sent covered it.",
  },
  {
    author: "Sana M.",
    product: "Spotify Premium",
    rating: 5,
    body: "Six months on my own account for less than a month of the official price. Playlists untouched.",
  },
  {
    author: "Usman T.",
    product: "NordVPN",
    rating: 5,
    body: "Connection speeds are genuinely good. Had one hiccup early on, they replaced the account the same day.",
  },
  {
    author: "Fatima N.",
    product: "Microsoft 365",
    rating: 5,
    body: "Installed on my laptop and my sister's. OneDrive storage alone was worth the price.",
  },
];

export const posts = [
  {
    slug: "streaming-plans-compared",
    title: "Single, dual or full account: which streaming plan do you actually need?",
    date: "2026-08-14",
    excerpt:
      "Screen count is the only thing that changes between most streaming tiers. Here is how to work out how many you need before you pay for more than you use.",
  },
  {
    slug: "keep-your-warranty-valid",
    title: "Six habits that keep your subscription warranty valid",
    date: "2026-07-29",
    excerpt:
      "Most warranty claims we reject come down to a settings change nobody warned the buyer about. These six habits prevent almost all of them.",
  },
  {
    slug: "iptv-setup-guide",
    title: "IPTV setup in ten minutes, on any device",
    date: "2026-07-02",
    excerpt:
      "From smart TV to Android box to a phone — the same four steps every time, plus what to do when the channel guide comes up empty.",
  },
  {
    slug: "own-account-vs-shared",
    title: "Own account vs shared access: what is the real difference?",
    date: "2026-06-11",
    excerpt:
      "One costs more and cannot be lost. The other is cheaper and needs the guidelines followed. A plain comparison, no sales pitch.",
  },
];

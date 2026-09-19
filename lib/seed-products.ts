import type { Product } from "./products.ts";

/**
 * Starter catalogue. Pushed into MongoDB by `npm run seed` — after that the
 * database is the source of truth and this file is only used to reseed.
 */
export const seedProducts: Product[] = [
  {
    slug: "netflix-premium",
    title: "Netflix Premium Subscription",
    category: "streaming",
    tagline: "4K Ultra HD quality",
    summary:
      "4K Ultra HD plans with single, dual, three screens or a private full account. Personalised profiles on every shared tier.",
    badges: ["Popular", "Pakistan Plans"],
    warranty: "28-Day Replacement Warranty",
    specs: [
      "4K Ultra HD quality on every plan",
      "Personalised profiles on shared plans",
      "Dedicated private access on the Full Account tier",
      "28-day replacement warranty",
      "Uninterrupted viewing with no screen-limit disruptions",
    ],
    featured: true,
    plans: [
      {
        id: "NFLX-1M-SINGLE",
        name: "Single Screen",
        meta: ["1 Screen", "4K Ultra HD", "1 Month"],
        price: 549,
      },
      {
        id: "NFLX-1M-DUAL",
        name: "Dual Screens",
        meta: ["2 Screens", "4K Ultra HD", "1 Month"],
        price: 1049,
      },
      {
        id: "NFLX-1M-TRIPLE",
        name: "Three Screens",
        meta: ["3 Screens", "4K Ultra HD", "1 Month"],
        price: 1499,
      },
      {
        id: "NFLX-1M-FULL",
        name: "Full Account",
        meta: ["5 Screens (Private)", "4K Ultra HD", "1 Month"],
        price: 2250,
        note: "Dedicated private access",
        badge: "Best value",
      },
    ],
  },
  {
    slug: "amazon-prime-video",
    title: "Amazon Prime Video",
    category: "streaming",
    tagline: "Originals, movies and live sport",
    summary:
      "Prime Video access on a private profile. Choose one, three or six months of uninterrupted streaming.",
    badges: ["Pakistan Plans"],
    warranty: "Full Duration Warranty",
    specs: [
      "Full HD streaming with offline downloads",
      "Private profile on a shared account",
      "Works on mobile, smart TV and browser",
      "Warranty covers the full plan duration",
    ],
    featured: true,
    plans: [
      {
        id: "PV-1M",
        name: "1 Month",
        meta: ["1 Profile", "Full HD", "1 Month"],
        price: 199,
      },
      {
        id: "PV-3M",
        name: "3 Months",
        meta: ["1 Profile", "Full HD", "3 Months"],
        price: 449,
      },
      {
        id: "PV-6M",
        name: "6 Months",
        meta: ["1 Profile", "Full HD", "6 Months"],
        price: 799,
        badge: "Best value",
      },
    ],
  },
  {
    slug: "spotify-premium",
    title: "Spotify Premium",
    category: "streaming",
    tagline: "Ad-free music on your own account",
    summary:
      "Premium upgrades applied to your existing Spotify account so your playlists and history stay intact.",
    badges: ["Own Account"],
    warranty: "Full Duration Warranty",
    specs: [
      "Ad-free listening and unlimited skips",
      "Upgrade applied to your own account",
      "Offline downloads on mobile and desktop",
      "Playlists and library preserved",
    ],
    featured: true,
    plans: [
      {
        id: "SPOT-1M",
        name: "1 Month",
        meta: ["Own account", "Ad-free", "1 Month"],
        price: 349,
      },
      {
        id: "SPOT-3M",
        name: "3 Months",
        meta: ["Own account", "Ad-free", "3 Months"],
        price: 899,
      },
      {
        id: "SPOT-6M",
        name: "6 Months",
        meta: ["Own account", "Ad-free", "6 Months"],
        price: 1599,
        badge: "Best value",
      },
    ],
  },
  {
    slug: "youtube-premium",
    title: "YouTube Premium",
    category: "streaming",
    tagline: "Ad-free video and background play",
    summary:
      "Ad-free YouTube with background playback and offline downloads, applied to your own Google account.",
    badges: ["Own Account"],
    warranty: "Full Duration Warranty",
    specs: [
      "No ads across YouTube and YouTube Music",
      "Background and picture-in-picture playback",
      "Offline downloads",
      "Applied to your own Google account",
    ],
    plans: [
      {
        id: "YT-1M",
        name: "1 Month",
        meta: ["Own account", "Ad-free", "1 Month"],
        price: 499,
      },
      {
        id: "YT-3M",
        name: "3 Months",
        meta: ["Own account", "Ad-free", "3 Months"],
        price: 1299,
      },
      {
        id: "YT-12M",
        name: "12 Months",
        meta: ["Own account", "Ad-free", "12 Months"],
        price: 4999,
        badge: "Best value",
      },
    ],
  },
  {
    slug: "hbo-max",
    title: "HBO Max Premium",
    category: "streaming",
    tagline: "Premium series and Warner releases",
    summary:
      "HBO Max on a single device with full access to the original series catalogue and same-day Warner releases.",
    badges: ["Premium"],
    warranty: "28-Day Replacement Warranty",
    specs: [
      "Full HBO Max catalogue",
      "Same-day Warner Bros. releases",
      "Full HD, single device",
      "28-day replacement warranty",
    ],
    featured: true,
    plans: [
      {
        id: "HBO-1M-1D",
        name: "1 Device",
        meta: ["1 device", "Full HD", "1 Month"],
        price: 499,
      },
      {
        id: "HBO-1M-2D",
        name: "2 Devices",
        meta: ["2 devices", "Full HD", "1 Month"],
        price: 849,
      },
    ],
  },
  {
    slug: "chatgpt-plus",
    title: "ChatGPT Plus",
    category: "ai",
    tagline: "Priority access to the latest models",
    summary:
      "ChatGPT Plus with priority model access, faster responses and advanced tooling. Restocking shortly.",
    badges: ["Coming Soon"],
    warranty: "27-Day Replacement Warranty",
    specs: [
      "Priority access during peak hours",
      "Latest models before free tier",
      "Advanced data analysis and file uploads",
      "27-day replacement warranty",
    ],
    comingSoon: true,
    featured: true,
    plans: [
      {
        id: "GPT-1M",
        name: "1 Month",
        meta: ["Shared access", "Priority model", "1 Month"],
        price: 1499,
      },
    ],
  },
  {
    slug: "claude-pro",
    title: "Claude Pro",
    category: "ai",
    tagline: "Higher usage limits for long work",
    summary:
      "Claude Pro with expanded usage limits, priority access at peak times and early access to new features.",
    badges: ["AI Tools"],
    warranty: "27-Day Replacement Warranty",
    specs: [
      "5x higher usage limits than the free tier",
      "Priority access at peak times",
      "Early access to new features",
      "27-day replacement warranty",
    ],
    featured: true,
    plans: [
      {
        id: "CLAUDE-1M",
        name: "1 Month",
        meta: ["Shared access", "Priority", "1 Month"],
        price: 1299,
      },
      {
        id: "CLAUDE-3M",
        name: "3 Months",
        meta: ["Shared access", "Priority", "3 Months"],
        price: 3499,
      },
    ],
  },
  {
    slug: "midjourney",
    title: "Midjourney",
    category: "ai",
    tagline: "Image generation with fast hours",
    summary:
      "Midjourney subscription with dedicated fast-generation hours and access to the full image toolbox.",
    badges: ["AI Tools"],
    warranty: "27-Day Replacement Warranty",
    specs: [
      "Dedicated fast-generation hours",
      "Full image toolbox and upscaling",
      "Commercial usage rights",
      "27-day replacement warranty",
    ],
    plans: [
      {
        id: "MJ-1M-BASIC",
        name: "Basic",
        meta: ["3.3 fast hrs", "1 Month"],
        price: 1599,
      },
      {
        id: "MJ-1M-STD",
        name: "Standard",
        meta: ["15 fast hrs", "1 Month"],
        price: 2999,
        badge: "Best value",
      },
    ],
  },
  {
    slug: "microsoft-365",
    title: "Microsoft 365",
    category: "productivity",
    tagline: "Word, Excel, PowerPoint and 1 TB cloud",
    summary:
      "Full desktop Office suite on your own Microsoft account with 1 TB of OneDrive storage.",
    badges: ["Own Account"],
    warranty: "Full Duration Warranty",
    specs: [
      "Word, Excel, PowerPoint and Outlook",
      "Install on up to 5 devices",
      "1 TB OneDrive storage",
      "Applied to your own Microsoft account",
    ],
    plans: [
      {
        id: "M365-1Y-1U",
        name: "1 Year — Individual",
        meta: ["1 user", "5 devices", "12 Months"],
        price: 2799,
      },
      {
        id: "M365-1Y-FAM",
        name: "1 Year — Family",
        meta: ["6 users", "5 devices each", "12 Months"],
        price: 3999,
        badge: "Best value",
      },
    ],
  },
  {
    slug: "grammarly-premium",
    title: "Grammarly Premium",
    category: "productivity",
    tagline: "Advanced writing and clarity checks",
    summary:
      "Grammarly Premium with advanced tone, clarity and plagiarism checks across browser, desktop and mobile.",
    badges: ["Productivity"],
    warranty: "Full Duration Warranty",
    specs: [
      "Advanced grammar and clarity suggestions",
      "Tone detection and rewriting",
      "Plagiarism detection",
      "Works in browser, desktop and mobile",
    ],
    plans: [
      {
        id: "GRAM-1M",
        name: "1 Month",
        meta: ["Shared access", "Premium", "1 Month"],
        price: 699,
      },
      {
        id: "GRAM-12M",
        name: "12 Months",
        meta: ["Shared access", "Premium", "12 Months"],
        price: 2999,
        badge: "Best value",
      },
    ],
  },
  {
    slug: "canva-pro",
    title: "Canva Pro",
    category: "creative",
    tagline: "Premium templates and brand kit",
    summary:
      "Canva Pro on an individual account with the full template library, brand kit and background remover.",
    badges: ["Individual account"],
    warranty: "Full Duration Warranty",
    specs: [
      "100M+ premium templates and assets",
      "Brand kit with custom fonts and colours",
      "Background remover and Magic tools",
      "Individual account access",
    ],
    featured: true,
    plans: [
      {
        id: "CANVA-1M",
        name: "1 Month",
        meta: ["Individual account", "1 Month"],
        price: 399,
      },
      {
        id: "CANVA-12M",
        name: "12 Months",
        meta: ["Individual account", "12 Months"],
        price: 1999,
        badge: "Best value",
      },
    ],
  },
  {
    slug: "capcut-pro",
    title: "CapCut Pro",
    category: "creative",
    tagline: "Premium video-editing tools",
    summary:
      "CapCut Pro unlocks every premium effect, export option and cloud asset for desktop and mobile editing.",
    badges: ["Pro"],
    warranty: "Full Duration Warranty",
    specs: [
      "All premium effects and transitions",
      "4K export without watermark",
      "Cloud storage and team assets",
      "Desktop and mobile",
    ],
    featured: true,
    plans: [
      {
        id: "CAPCUT-1M",
        name: "1 Month",
        meta: ["Shared access", "Pro", "1 Month"],
        price: 999,
      },
      {
        id: "CAPCUT-12M",
        name: "12 Months",
        meta: ["Shared access", "Pro", "12 Months"],
        price: 4999,
        badge: "Best value",
      },
    ],
  },
  {
    slug: "nordvpn",
    title: "NordVPN",
    category: "vpn",
    tagline: "Fast encrypted connections",
    summary:
      "NordVPN across multiple devices with threat protection, no-logs policy and servers worldwide.",
    badges: ["VPN"],
    warranty: "27-Day Replacement Warranty",
    specs: [
      "Multiple devices on one subscription",
      "Threat protection and ad blocking",
      "Strict no-logs policy",
      "27-day replacement warranty",
    ],
    featured: true,
    plans: [
      {
        id: "NORD-1M",
        name: "1 Month",
        meta: ["6 devices", "1 Month"],
        price: 499,
      },
      {
        id: "NORD-12M",
        name: "12 Months",
        meta: ["6 devices", "12 Months"],
        price: 3499,
        badge: "Best value",
      },
    ],
  },
  {
    slug: "expressvpn",
    title: "ExpressVPN",
    category: "vpn",
    tagline: "Lightway protocol, 90+ countries",
    summary:
      "ExpressVPN on your own account with the Lightway protocol and servers in more than 90 countries.",
    badges: ["Own Account"],
    warranty: "Full Duration Warranty",
    specs: [
      "Servers in 90+ countries",
      "Lightway protocol for speed",
      "8 devices on one account",
      "TrustedServer technology",
    ],
    plans: [
      {
        id: "EXPRESS-1M",
        name: "1 Month",
        meta: ["8 devices", "1 Month"],
        price: 899,
      },
      {
        id: "EXPRESS-12M",
        name: "12 Months",
        meta: ["8 devices", "12 Months"],
        price: 5499,
        badge: "Best value",
      },
    ],
  },
  {
    slug: "iptv-live-tv",
    title: "IPTV — Live TV 4K",
    category: "iptv",
    tagline: "30,000+ live TV channels",
    summary:
      "Live TV, sports and movie channels in 4K with catch-up, EPG and support for every major device.",
    badges: ["Best seller"],
    warranty: "Full Duration Warranty",
    specs: [
      "30,000+ live TV channels",
      "4K and FHD streams with EPG",
      "Sports, movies and catch-up TV",
      "Works on smart TV, Android, iOS and MAG",
    ],
    featured: true,
    plans: [
      {
        id: "IPTV-1M",
        name: "1 Month",
        meta: ["1 connection", "4K", "1 Month"],
        price: 399,
      },
      {
        id: "IPTV-6M",
        name: "6 Months",
        meta: ["1 connection", "4K", "6 Months"],
        price: 1699,
        badge: "Best value",
      },
      {
        id: "IPTV-12M",
        name: "12 Months",
        meta: ["2 connections", "4K", "12 Months"],
        price: 2999,
      },
    ],
  },
];

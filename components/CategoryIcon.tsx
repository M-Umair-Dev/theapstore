import type { ReactNode } from "react";

/**
 * One icon per category slug. Homepage tiles, the categories page, and a
 * category page all use this so a slug never picks a different mark.
 */
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      {children}
    </svg>
  );
}

const icons: Record<string, ReactNode> = {
  streaming: (
    <Icon>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M10 9.5v5l4.5-2.5L10 9.5z" />
    </Icon>
  ),
  ai: (
    <Icon>
      <path d="M12 3.5 13.6 8 18.2 9.5 13.6 11 12 15.5 10.4 11 5.8 9.5 10.4 8 12 3.5z" />
      <path d="M18 15.2 18.7 17l1.8.7-1.8.7L18 20.2 17.3 18.4 15.5 17.7l1.8-.7L18 15.2z" />
    </Icon>
  ),
  productivity: (
    <Icon>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5v-13A2.5 2.5 0 0 1 6.5 2z" />
    </Icon>
  ),
  creative: (
    <Icon>
      <path d="M12 19.2 19.2 12a2.4 2.4 0 0 0-3.4-3.4L8.6 15.8 12 19.2z" />
      <path d="M8.6 15.8 6.4 18.6a1.2 1.2 0 0 0 1.6 1.6l2.8-2.2" />
      <path d="m14.2 6.2 3.6 3.6" />
    </Icon>
  ),
  vpn: (
    <Icon>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12.2 11 14l4-4.2" />
    </Icon>
  ),
  iptv: (
    <Icon>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="m8 3 4 4 4-4" />
    </Icon>
  ),
};

function Bag() {
  return (
    <Icon>
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </Icon>
  );
}

export default function CategoryIcon({ slug }: { slug: string }) {
  return (
    <span className="cat-icon" aria-hidden="true">
      {icons[slug] ?? <Bag />}
    </span>
  );
}

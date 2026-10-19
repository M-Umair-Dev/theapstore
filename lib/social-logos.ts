import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Finds a logo file for each footer social account, the same way
 * lib/payment-logos.ts does for payment methods.
 *
 * Server-only. The footer is a server component, so the result is used
 * directly — no context plumbing needed.
 *
 * Drop assets into public/social/:
 *   public/social/whatsapp.svg
 *   public/social/facebook.svg
 *   public/social/tiktok.svg
 */

export type SocialId = "whatsapp" | "facebook" | "tiktok";

export const socialIds: SocialId[] = ["whatsapp", "facebook", "tiktok"];

const SOCIAL_DIR = path.join(process.cwd(), "public", "social");

const fileNames = (id: SocialId) => [`${id}.svg`, `${id}.png`, `${id}.webp`];

let cache: Map<SocialId, string | null> | null = null;

function build() {
  const found = new Map<SocialId, string | null>();
  for (const id of socialIds) {
    const hit = fileNames(id).find((name) =>
      existsSync(path.join(SOCIAL_DIR, name)),
    );
    found.set(id, hit ? `/social/${hit}` : null);
  }
  return found;
}

export function resolveSocialLogos(): Record<SocialId, string | null> {
  cache ??= build();
  return Object.fromEntries(cache) as Record<SocialId, string | null>;
}

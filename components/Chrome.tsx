"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { SocialId } from "@/lib/social-logos";

const BARE = ["/admin", "/login"];

/**
 * Storefront chrome. The admin panel and the login screen render their own
 * full-page shell, so the shop header and footer are suppressed there.
 *
 * The social logo paths arrive as a prop rather than being looked up here:
 * this component is client-side, and the lookup touches the filesystem.
 */
export default function Chrome({
  children,
  socialLogos,
}: {
  children: React.ReactNode;
  socialLogos: Record<SocialId, string | null>;
}) {
  const pathname = usePathname();
  const bare = BARE.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (bare) return <>{children}</>;

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer socialLogos={socialLogos} />
    </>
  );
}

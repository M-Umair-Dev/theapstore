import type { Metadata } from "next";
import Chrome from "@/components/Chrome";
import { CartProvider } from "@/lib/cart";
import { site } from "@/lib/site";
import { resolveSocialLogos } from "@/lib/social-logos";
import "./globals.css";
import "./ui.css";

export const metadata: Metadata = {
  title: {
    default: `${site.name} — Digital subscriptions and online services`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolved here, on the server. Chrome is a client component, so anything it
  // imports — Footer included — is bundled for the browser, and the footer's
  // logo lookup reads the filesystem.
  const socialLogos = resolveSocialLogos();

  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Chrome socialLogos={socialLogos}>{children}</Chrome>
        </CartProvider>
      </body>
    </html>
  );
}

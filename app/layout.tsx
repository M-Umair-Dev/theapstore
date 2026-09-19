import type { Metadata } from "next";
import Chrome from "@/components/Chrome";
import { CartProvider } from "@/lib/cart";
import { site } from "@/lib/site";
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
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Chrome>{children}</Chrome>
        </CartProvider>
      </body>
    </html>
  );
}

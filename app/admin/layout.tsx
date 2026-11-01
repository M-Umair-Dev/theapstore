import Link from "next/link";
import { requireAdmin } from "@/auth";
import Logo from "@/components/Logo";
import { site } from "@/lib/site";
import { countBlogs } from "@/lib/blogs";
import { adminStats } from "@/lib/repo";
import { signOutAction } from "./actions";
import "../admin.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const [stats, blogCount] = await Promise.all([adminStats(), countBlogs()]);

  const nav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/products", label: "Products", count: stats.products },
    { href: "/admin/orders", label: "Orders", count: stats.orders },
    { href: "/admin/customers", label: "Customers", count: stats.customers },
    { href: "/admin/payments", label: "Payment Methods" },
    { href: "/admin/blog", label: "Blog", count: blogCount },
    { href: "/admin/hero", label: "Hero Section" },
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <Logo />
          <span>
            <span className="logo-name">{site.name}</span>
            <span className="logo-sub">Admin</span>
          </span>
        </Link>

        <nav className="admin-nav" aria-label="Admin">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
              {item.count !== undefined && (
                <span className="count">{item.count}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <span>{session.user?.email}</span>
          <Link href="/" target="_blank">
            View Storefront
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="link-btn">
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}

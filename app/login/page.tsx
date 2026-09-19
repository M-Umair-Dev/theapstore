import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { site } from "@/lib/site";
import LoginForm from "./LoginForm";
import "../admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const session = await auth();
  if (session?.user) redirect(next?.startsWith("/") ? next : "/admin");

  return (
    <div className="admin-auth">
      <div className="admin-auth-card">
        <span className="eyebrow">{site.name}</span>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Admin sign in</h1>
        <p className="auth-lead">
          Staff access only. Customers can order without an account.
        </p>
        <LoginForm next={next?.startsWith("/") ? next : "/admin"} />
      </div>
    </div>
  );
}

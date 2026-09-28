import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import TrackForm from "./TrackForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Order",
  description:
    "Enter your order reference and the email you ordered with to see the current status.",
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  return (
    <>
      <Breadcrumbs
        items={[{ href: "/", label: "Home" }, { label: "Track Order" }]}
      />

      <div className="container" style={{ paddingTop: "var(--space-6)" }}>
        <h1 className="section-title">Track your order</h1>
        <p className="section-lead">
          Your reference is on the confirmation you saw after ordering, and in
          the email we sent. Enter it with the email address you ordered with.
        </p>
      </div>

      <div
        className="container"
        style={{ paddingBlock: "var(--space-7) var(--space-8)", maxWidth: 720 }}
      >
        <TrackForm initialReference={reference ?? ""} />
      </div>
    </>
  );
}

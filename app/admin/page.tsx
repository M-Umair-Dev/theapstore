import Link from "next/link";
import { formatPrice } from "@/lib/products";
import { adminStats, listOrders, orderStatuses } from "@/lib/repo";

export const dynamic = "force-dynamic";

const formatDate = (d: Date) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function AdminDashboard() {
  const [stats, recent] = await Promise.all([adminStats(), listOrders()]);

  const tiles = [
    { label: "Revenue (verified)", value: formatPrice(stats.revenue), accent: true },
    { label: "Orders", value: String(stats.orders) },
    { label: "Pending", value: String(stats.pending) },
    { label: "Products", value: String(stats.products) },
  ];

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Dashboard</h1>
          <p>Everything in the store at a glance.</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          Add product
        </Link>
      </div>

      <div className="stat-grid">
        {tiles.map((t) => (
          <div
            className={`stat-tile${t.accent ? " is-accent" : ""}`}
            key={t.label}
          >
            <div className="stat-label">{t.label}</div>
            <div className="stat-value">{t.value}</div>
          </div>
        ))}
      </div>

      <div className="admin-panel">
        <h2>Recent orders</h2>

        {recent.length === 0 ? (
          <p className="hint">
            No orders yet. Orders placed through the site show up here.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 6).map((order) => (
                  <tr key={order.reference}>
                    <td className="nowrap">{order.reference}</td>
                    <td>
                      {order.customer.name}
                      <br />
                      <span className="muted">{order.customer.email}</span>
                    </td>
                    <td>{order.items.length}</td>
                    <td className="nowrap">{formatPrice(order.total)}</td>
                    <td>
                      <span
                        className={`pill${
                          order.status === "pending"
                            ? ""
                            : order.status === "cancelled"
                              ? " pill-off"
                              : " pill-ok"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="nowrap muted">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {recent.length > 0 && (
          <p style={{ marginTop: "var(--space-5)" }}>
            <Link href="/admin/orders" className="link-btn">
              Manage all {recent.length} orders
            </Link>
          </p>
        )}
      </div>

      <div className="admin-panel">
        <h2>Order statuses</h2>
        <p className="hint">
          {orderStatuses.join(" · ")} — set these from the Orders page. Only
          verified and delivered orders count toward revenue.
        </p>
      </div>
    </>
  );
}

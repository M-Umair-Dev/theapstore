import { updateOrderStatusAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/products";
import { listOrders, orderStatuses } from "@/lib/repo";

export const dynamic = "force-dynamic";

const formatDateTime = (d: Date) =>
  new Date(d).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const { updated } = await searchParams;
  const orders = await listOrders();

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Orders</h1>
          <p>
            {orders.length} order{orders.length === 1 ? "" : "s"} placed through
            the site.
          </p>
        </div>
      </div>

      {updated && (
        <p className="form-success" style={{ marginBottom: "var(--space-5)" }}>
          Updated <strong>{updated}</strong>.
        </p>
      )}

      {orders.length === 0 ? (
        <div className="admin-panel">
          <p className="hint">
            No orders yet. Orders from the checkout form land here; WhatsApp
            orders stay in your WhatsApp inbox.
          </p>
        </div>
      ) : (
        orders.map((order) => (
          <div className="admin-panel" key={order.reference}>
            <div className="repeat-head">
              <span>
                {order.reference} · {formatDateTime(order.createdAt)}
              </span>
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
            </div>

            <div className="form-row" style={{ marginBottom: "var(--space-5)" }}>
              <div>
                <div className="stat-label">Customer</div>
                <p style={{ marginTop: 6 }}>{order.customer.name}</p>
                <p className="muted">
                  {order.customer.email}
                  <br />
                  {order.customer.phone}
                </p>
              </div>
              <div>
                <div className="stat-label">Payment</div>
                <p style={{ marginTop: 6 }}>{order.paymentMethod}</p>
                <p className="muted">
                  Total {formatPrice(order.total)}
                  {order.notes ? (
                    <>
                      <br />
                      Note: {order.notes}
                    </>
                  ) : null}
                </p>
              </div>
            </div>

            <div className="table-wrap" style={{ marginBottom: "var(--space-5)" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Plan</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={`${item.slug}-${item.planId}`}>
                      <td>{item.title}</td>
                      <td className="muted">
                        {item.planName} · {item.meta}
                      </td>
                      <td>{item.qty}</td>
                      <td className="nowrap">
                        {formatPrice(item.price * item.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form action={updateOrderStatusAction} className="form-actions">
              <input type="hidden" name="reference" value={order.reference} />
              <select
                name="status"
                className="select"
                defaultValue={order.status}
              >
                {orderStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary btn-sm">
                Update status
              </button>
              <a
                className="link-btn"
                href={`mailto:${order.customer.email}?subject=${encodeURIComponent(
                  `Your ${order.reference} order`,
                )}`}
              >
                Email customer
              </a>
            </form>
          </div>
        ))
      )}
    </>
  );
}

import { formatPrice } from "@/lib/products";
import { listOrders, listUsers } from "@/lib/repo";

export const dynamic = "force-dynamic";

type Customer = {
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  last: Date;
};

export default async function AdminCustomers() {
  const [orders, users] = await Promise.all([listOrders(), listUsers()]);

  // Customers are derived from orders — there are no customer accounts.
  const byEmail = new Map<string, Customer>();
  for (const order of orders) {
    const email = order.customer.email;
    const existing = byEmail.get(email);
    const counted = order.status === "verified" || order.status === "delivered";

    if (existing) {
      existing.orders += 1;
      if (counted) existing.spent += order.total;
      if (order.createdAt > existing.last) existing.last = order.createdAt;
    } else {
      byEmail.set(email, {
        name: order.customer.name,
        email,
        phone: order.customer.phone,
        orders: 1,
        spent: counted ? order.total : 0,
        last: order.createdAt,
      });
    }
  }

  const customers = [...byEmail.values()].sort((a, b) => b.spent - a.spent);

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Customers</h1>
          <p>
            {customers.length} customer
            {customers.length === 1 ? "" : "s"} built from order history.
          </p>
        </div>
      </div>

      <div className="admin-panel">
        <h2>Buyers</h2>
        {customers.length === 0 ? (
          <p className="hint">
            No orders yet, so there is nobody to list. Customers appear here as
            soon as an order is placed.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Spent</th>
                  <th>Last order</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.email}>
                    <td>{c.name}</td>
                    <td className="muted">
                      <a
                        href={`mailto:${c.email}`}
                        style={{ color: "var(--primary-on-dark)" }}
                      >
                        {c.email}
                      </a>
                    </td>
                    <td className="muted nowrap">{c.phone}</td>
                    <td>{c.orders}</td>
                    <td className="nowrap">{formatPrice(c.spent)}</td>
                    <td className="muted nowrap">
                      {new Date(c.last).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <h2>Staff accounts</h2>
        <p className="hint" style={{ marginBottom: "var(--space-5)" }}>
          Accounts that can sign in here. Create them with{" "}
          <code>npm run seed</code> and the SEED_ADMIN_* values in{" "}
          <code>.env.local</code>.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email}>
                  <td>{u.name}</td>
                  <td className="muted">{u.email}</td>
                  <td>
                    <span className="pill pill-primary">{u.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

import ConfirmSubmit from "@/components/ConfirmSubmit";
import {
  deleteCustomerAction,
  deleteStaffAction,
} from "@/app/admin/actions";
import { formatPrice } from "@/lib/products";
import { DELETED_CUSTOMER, listOrders, listUsers } from "@/lib/repo";

export const dynamic = "force-dynamic";

type Customer = {
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  last: Date;
};

type Params = { deleted?: string; error?: string };

export default async function AdminCustomers({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const [sp, orders, users] = await Promise.all([
    searchParams,
    listOrders(),
    listUsers(),
  ]);

  // Customers are derived from orders — there are no customer accounts. Orders
  // whose customer was erased keep the placeholder address, which is not a
  // person and is left out of the list.
  const byEmail = new Map<string, Customer>();
  for (const order of orders) {
    const email = order.customer.email;
    if (!email || email === DELETED_CUSTOMER.email) continue;

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

      {sp.deleted && (
        <p className="form-success" style={{ marginBottom: "var(--space-5)" }}>
          Removed <strong>{sp.deleted}</strong>.
        </p>
      )}
      {sp.error && (
        <p className="form-error" role="alert" style={{ marginBottom: "var(--space-5)" }}>
          {sp.error}
        </p>
      )}

      <div className="admin-panel">
        <h2>Buyers</h2>
        <p className="hint" style={{ marginBottom: "var(--space-5)" }}>
          Customers have no accounts of their own — each one exists as the
          details on their orders. Removing a customer erases those details and
          leaves the order, its items and its total intact for your records.
        </p>

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
                  <th />
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
                    <td className="table-actions">
                      <form action={deleteCustomerAction}>
                        <input type="hidden" name="email" value={c.email} />
                        <input
                          type="hidden"
                          name="back"
                          value="/admin/customers"
                        />
                        <ConfirmSubmit
                          label="Delete"
                          pendingLabel="Removing…"
                          message={`Delete customer ${c.name}?\n\nThis erases ${c.name}'s name, email and phone from all ${c.orders} of their orders.\n\nThe orders themselves, their items, totals and payment screenshots are kept for your records, and they stop being traceable to this customer. Order tracking with this email will no longer work.\n\nThis action cannot be undone.`}
                        />
                      </form>
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
                <th />
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
                  <td className="table-actions">
                    <form action={deleteStaffAction}>
                      <input type="hidden" name="email" value={u.email} />
                      <input
                        type="hidden"
                        name="back"
                        value="/admin/customers"
                      />
                      <ConfirmSubmit
                        label="Delete"
                        message={`Delete the sign-in account for ${u.name} (${u.email})?\n\nThey lose access to this admin panel immediately.\n\nThis action cannot be undone.`}
                      />
                    </form>
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

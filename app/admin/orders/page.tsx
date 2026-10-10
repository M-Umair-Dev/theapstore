import Link from "next/link";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import FulfilmentForm from "@/components/FulfilmentForm";
import {
  deleteOrderAction,
  markWhatsAppSentAction,
  sendAccountDetailsAction,
  updateOrderStatusAction,
} from "@/app/admin/actions";
import { emailConfigured } from "@/lib/email";
import { deliveryLabel } from "@/lib/order-status";
import { formatPrice } from "@/lib/products";
import { site } from "@/lib/site";
import { IMAGE_ACCEPT } from "@/lib/uploads";
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

const sorts = {
  newest: "Newest first",
  oldest: "Oldest first",
  amount: "Highest total",
} as const;

type Sort = keyof typeof sorts;

type Params = {
  updated?: string;
  deleted?: string;
  sent?: string;
  whatsapp?: string;
  error?: string;
  q?: string;
  status?: string;
  sort?: string;
};

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const sp = await searchParams;
  const orders = await listOrders();

  const term = sp.q?.trim().toLowerCase() ?? "";
  const status = orderStatuses.find((s) => s === sp.status);
  const sort: Sort = sp.sort && sp.sort in sorts ? (sp.sort as Sort) : "newest";

  const needle = term
    ? orders.filter(
        (o) =>
          o.reference.toLowerCase().includes(term) ||
          o.customer.name.toLowerCase().includes(term) ||
          o.customer.email.toLowerCase().includes(term),
      )
    : orders;

  const matching = status
    ? needle.filter((o) => o.status === status)
    : needle;

  const shown = [...matching].sort((a, b) => {
    if (sort === "amount") return b.total - a.total;
    const diff = a.createdAt.getTime() - b.createdAt.getTime();
    return sort === "oldest" ? diff : -diff;
  });

  const filtered = Boolean(term || status);

  // Keeps the admin on the same filtered view after any action on this page.
  const backHref = `/admin/orders${
    filtered
      ? `?q=${encodeURIComponent(sp.q ?? "")}&status=${encodeURIComponent(status ?? "")}&sort=${sort}`
      : ""
  }`;

  const mailReady = emailConfigured();

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Orders</h1>
          <p>
            {orders.length} order{orders.length === 1 ? "" : "s"} placed through
            the site
            {filtered && ` · ${shown.length} shown`}.
          </p>
        </div>
      </div>

      {sp.sent && (
        <p className="form-success" style={{ marginBottom: "var(--space-5)" }}>
          Account details for <strong>{sp.sent}</strong> were accepted by the
          mail server. That means they were sent, not that they have landed in
          the customer&apos;s inbox.
        </p>
      )}
      {sp.whatsapp && (
        <p className="form-success" style={{ marginBottom: "var(--space-5)" }}>
          Recorded that the details for <strong>{sp.whatsapp}</strong> were sent
          on WhatsApp.
        </p>
      )}
      {sp.deleted && (
        <p className="form-success" style={{ marginBottom: "var(--space-5)" }}>
          Deleted order <strong>{sp.deleted}</strong> and its payment screenshot.
        </p>
      )}
      {sp.updated && (
        <p className="form-success" style={{ marginBottom: "var(--space-5)" }}>
          Updated <strong>{sp.updated}</strong>.
        </p>
      )}
      {sp.error && (
        <p className="form-error" role="alert" style={{ marginBottom: "var(--space-5)" }}>
          {sp.error}
        </p>
      )}

      {!mailReady && (
        <p className="form-error" role="alert" style={{ marginBottom: "var(--space-5)" }}>
          Email sending is not configured yet, so the send form below will
          refuse with a configuration error. Set <code>SMTP_USER</code> and{" "}
          <code>SMTP_PASS</code> (a Google App Password) in the environment.
        </p>
      )}

      {orders.length > 0 && (
        <form className="admin-panel admin-form" method="get">
          <div className="form-row form-row-3">
            <div className="field">
              <label className="label" htmlFor="order-q">
                Search
              </label>
              <input
                id="order-q"
                name="q"
                className="input"
                defaultValue={sp.q ?? ""}
                placeholder="Reference, customer name or email"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="order-status">
                Status
              </label>
              <select
                id="order-status"
                name="status"
                className="select"
                defaultValue={status ?? ""}
              >
                <option value="">Any status</option>
                {orderStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="order-sort">
                Sort
              </label>
              <select
                id="order-sort"
                name="sort"
                className="select"
                defaultValue={sort}
              >
                {Object.entries(sorts).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: "var(--space-4)" }}>
            <button type="submit" className="btn btn-primary btn-sm">
              Apply
            </button>
            {filtered && (
              <Link href="/admin/orders" className="link-btn">
                Clear filters
              </Link>
            )}
          </div>
        </form>
      )}

      {orders.length === 0 ? (
        <div className="admin-panel">
          <p className="hint">
            No orders yet. Orders from the checkout form land here; WhatsApp
            orders stay in your WhatsApp inbox.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <div className="admin-panel">
          <p className="hint">
            No order matches those filters. Clear them to see all{" "}
            {orders.length} again.
          </p>
        </div>
      ) : (
        shown.map((order) => (
          <div className="admin-panel" key={order.reference}>
            <div className="repeat-head">
              <span>
                {order.reference} · {formatDateTime(order.createdAt)}
              </span>
              <span className="head-pills">
                <span className="pill pill-primary">
                  {deliveryLabel(order.deliveryMethod)}
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
              <div>
                <div className="stat-label">Delivery method</div>
                <p style={{ marginTop: 6 }}>
                  <strong>{deliveryLabel(order.deliveryMethod)}</strong>
                </p>
                <p className="muted">
                  {order.fulfillment
                    ? `Sent ×${order.fulfillment.count} via ${deliveryLabel(
                        order.fulfillment.channel,
                      )} on ${formatDateTime(order.fulfillment.sentAt)}`
                    : "Not sent yet"}
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

            <div className="receipt-block">
              <div className="stat-label">Payment screenshot</div>
              {order.receiptContentType ? (
                <>
                  <a
                    href={`/api/receipt/${order.reference}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/receipt/${order.reference}`}
                      alt={`Payment screenshot for ${order.reference}`}
                    />
                  </a>
                  <p className="hint">Click to open full size.</p>
                </>
              ) : (
                <p className="hint">
                  No screenshot uploaded. Ask the customer to send it on
                  WhatsApp or email before delivering.
                </p>
              )}
            </div>

            <div className="order-foot">
              <form action={updateOrderStatusAction} className="form-actions">
                <input type="hidden" name="reference" value={order.reference} />
                <select
                  name="status"
                  className="select"
                  defaultValue={order.status}
                  aria-label={`Status for ${order.reference}`}
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

              {/* Separate form — a form cannot be nested inside another, and
                  this one must never run on an accidental status update. */}
              <form action={deleteOrderAction}>
                <input type="hidden" name="reference" value={order.reference} />
                <input type="hidden" name="back" value={backHref} />
                <ConfirmSubmit
                  label="Delete order"
                  message={`Delete Order ${order.reference}?\n\nThis permanently removes the order for ${order.customer.name} (${formatPrice(
                    order.total,
                  )}) and its payment screenshot from the database.\n\nThis action cannot be undone.`}
                />
              </form>
            </div>

            <details className="fulfil">
              <summary>
                Send account details
                {order.fulfillment ? (
                  <span className="pill pill-ok" style={{ marginLeft: "var(--space-3)" }}>
                    sent ×{order.fulfillment.count}
                  </span>
                ) : null}
              </summary>

              {order.fulfillment && (
                <p className="hint" style={{ marginTop: "var(--space-4)" }}>
                  Last sent to {order.fulfillment.sentTo} by{" "}
                  {order.fulfillment.sentBy} on{" "}
                  {formatDateTime(order.fulfillment.sentAt)}. Saving the form
                  again sends another email.
                </p>
              )}

              {order.deliveryMethod === "whatsapp" && (
                <p className="hint" style={{ marginTop: "var(--space-4)", marginBottom: 0 }}>
                  This customer asked for WhatsApp. WhatsApp is preselected
                  below — switch it to email if you would rather send that.
                </p>
              )}

              {/* One form, both methods. The credential fields below are
                  rendered on the server and passed in as children. */}
              <FulfilmentForm
                id={`fulfil-${order.reference}`}
                action={sendAccountDetailsAction}
                confirmAction={markWhatsAppSentAction}
                back={backHref}
                order={{
                  reference: order.reference,
                  customerName: order.customer.name,
                  phone: order.customer.phone,
                  items: order.items.map((i) => ({
                    title: i.title,
                    planName: i.planName,
                    meta: i.meta,
                  })),
                  storeName: site.name,
                  contactEmail: site.email,
                  countryCode: site.whatsappCountryCode,
                  ...(order.deliveryMethod
                    ? { preferred: order.deliveryMethod }
                    : {}),
                }}
              >
                <input type="hidden" name="reference" value={order.reference} />
                <input type="hidden" name="back" value={backHref} />

                <div className="form-row">
                  <div className="field">
                    <label className="label" htmlFor={`to-${order.reference}`}>
                      Customer email
                    </label>
                    <input
                      id={`to-${order.reference}`}
                      name="to"
                      type="email"
                      className="input"
                      defaultValue={order.customer.email}
                      required
                    />
                    <span className="hint">
                      Prefilled from the order. The email path sends here.
                    </span>
                  </div>

                  <div className="field">
                    <label
                      className="label"
                      htmlFor={`phone-${order.reference}`}
                    >
                      Customer WhatsApp number
                    </label>
                    <input
                      id={`phone-${order.reference}`}
                      name="phone"
                      className="input"
                      defaultValue={order.customer.phone}
                    />
                    <span className="hint">
                      Prefilled from the order. The WhatsApp path opens a chat
                      with this number.
                    </span>
                  </div>

                  <div className="field">
                    <label
                      className="label"
                      htmlFor={`user-${order.reference}`}
                    >
                      Account username or email
                    </label>
                    <input
                      id={`user-${order.reference}`}
                      name="username"
                      className="input"
                      autoComplete="off"
                      spellCheck={false}
                      required
                    />
                  </div>

                  <div className="field">
                    <label
                      className="label"
                      htmlFor={`pass-${order.reference}`}
                    >
                      Account password
                    </label>
                    <input
                      id={`pass-${order.reference}`}
                      name="password"
                      className="input"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <span className="hint">
                      Shown as you type so you can check it. Not saved — a resend
                      means entering it again.
                    </span>
                  </div>

                  <div className="field">
                    <label
                      className="label"
                      htmlFor={`dur-${order.reference}`}
                    >
                      Duration
                    </label>
                    <input
                      id={`dur-${order.reference}`}
                      name="duration"
                      className="input"
                      placeholder="3 Months"
                    />
                  </div>

                  <div className="field">
                    <label
                      className="label"
                      htmlFor={`exp-${order.reference}`}
                    >
                      Expiry date
                    </label>
                    <input
                      id={`exp-${order.reference}`}
                      name="expiry"
                      className="input"
                      placeholder="12 January 2027"
                    />
                  </div>

                  <div className="field field-full">
                    <label
                      className="label"
                      htmlFor={`how-${order.reference}`}
                    >
                      Login and usage instructions
                    </label>
                    <textarea
                      id={`how-${order.reference}`}
                      name="instructions"
                      className="textarea"
                      placeholder={
                        "Sign in at netflix.com with the details above.\nDo not change the password or profile names."
                      }
                    />
                  </div>

                  <div className="field field-full">
                    <label
                      className="label"
                      htmlFor={`note-${order.reference}`}
                    >
                      Additional notes
                    </label>
                    <textarea
                      id={`note-${order.reference}`}
                      name="notes"
                      className="textarea"
                    />
                  </div>

                  <div className="field field-full">
                    <label
                      className="label"
                      htmlFor={`files-${order.reference}`}
                    >
                      Screenshots or instructions (optional)
                    </label>
                    <input
                      id={`files-${order.reference}`}
                      name="attachments"
                      type="file"
                      className="input"
                      accept={IMAGE_ACCEPT}
                      multiple
                    />
                    <span className="hint">
                      Up to 5 images, 4 MB each and 10 MB in total. Attached to
                      the email. A WhatsApp chat cannot carry files — attach them
                      in the chat yourself.
                    </span>
                  </div>
                </div>
              </FulfilmentForm>
            </details>
          </div>
        ))
      )}
    </>
  );
}

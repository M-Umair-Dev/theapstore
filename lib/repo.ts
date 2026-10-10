import { getDb } from "./mongodb.ts";
import {
  orderStatuses,
  type DeliveryMethod,
  type OrderStatus,
} from "./order-status.ts";
import type { Product } from "./products.ts";

/* ---------------- types ---------------- */

// Re-exported so existing importers keep working; the canonical definitions
// live in order-status.ts, which client components can import safely.
export { orderStatuses };
export type { OrderStatus };
export type { DeliveryMethod };

export type OrderItem = {
  slug: string;
  title: string;
  planId: string;
  planName: string;
  meta: string;
  price: number;
  qty: number;
};

/**
 * Record of account details being emailed to the customer. Deliberately holds
 * no credentials — only who sent what, to whom. The password the admin typed
 * lives in the outgoing message and nowhere else, so a resend means typing it
 * again; that is the price of never keeping a customer's password at rest.
 */
export type OrderFulfillment = {
  sentAt: Date;
  sentTo: string;
  /** Email of the admin who sent it. */
  sentBy: string;
  /** How it went out. WhatsApp is recorded when the admin confirms they sent
   *  it themselves — opening a chat window is not a delivery. */
  channel: DeliveryMethod;
  /** SMTP id of the last message, for chasing one that never arrived. */
  messageId?: string;
  /** 1 on the first send, higher after a resend. */
  count: number;
};

export type Order = {
  /** Human-facing id, e.g. TAS-4F2K9. Unique. Used as the admin key. */
  reference: string;
  /** Set when a logged-in customer placed it. */
  userId?: string;
  customer: { name: string; email: string; phone: string };
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  notes?: string;
  /** MIME type of the payment screenshot, if the customer uploaded one. */
  receiptContentType?: string;
  status: OrderStatus;
  /** How the customer asked to receive their details. Absent on orders placed
   *  before the choice existed — read it through `deliveryLabel`. */
  deliveryMethod?: DeliveryMethod;
  /** Present once account details have been sent. Payment status above is
   *  tracked separately. */
  fulfillment?: OrderFulfillment;
  createdAt: Date;
};

/**
 * Payment screenshots, keyed by order reference. Separate from the order
 * document for the same reason as product images: the admin order list should
 * not pull megabytes of image data to render a table.
 */
export type OrderReceipt = {
  reference: string;
  contentType: string;
  data: string;
  updatedAt: Date;
};

export type Role = "admin" | "customer";

export type AppUser = {
  name: string;
  /** Lowercased. Unique. Used as the admin key. */
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
};

export type ProductDoc = Product & { createdAt: Date; updatedAt: Date };

/**
 * Product images live in their own collection, keyed by slug. Keeping the bytes
 * out of the product document means listing 15 products doesn't drag 15 images
 * through every page render. Stored base64 — simpler than BSON Binary and the
 * size overhead is irrelevant at this scale.
 */
export type ProductImage = {
  slug: string;
  contentType: string;
  data: string;
  updatedAt: Date;
};

/* ---------------- collections ---------------- */

const products = () => getDb().collection<ProductDoc>("products");
const orders = () => getDb().collection<Order>("orders");
const users = () => getDb().collection<AppUser>("users");
const images = () => getDb().collection<ProductImage>("images");
const receipts = () => getDb().collection<OrderReceipt>("receipts");

let indexesReady: Promise<void> | null = null;

/** Created once per process, on first query. */
function ensureIndexes() {
  indexesReady ??= Promise.all([
    products().createIndex({ slug: 1 }, { unique: true }),
    products().createIndex({ category: 1 }),
    orders().createIndex({ reference: 1 }, { unique: true }),
    orders().createIndex({ "customer.email": 1 }),
    orders().createIndex({ createdAt: -1 }),
    users().createIndex({ email: 1 }, { unique: true }),
    images().createIndex({ slug: 1 }, { unique: true }),
    receipts().createIndex({ reference: 1 }, { unique: true }),
  ]).then(() => undefined);
  return indexesReady;
}

/* ---------------- products ---------------- */

/** Strips the Mongo-only fields so results are safe to hand to components. */
const toProduct = (doc: ProductDoc): Product => {
  const { _id, createdAt, updatedAt, ...product } = doc as ProductDoc & {
    _id?: unknown;
  };
  return product;
};

export async function listProducts(): Promise<Product[]> {
  await ensureIndexes();
  const docs = await products().find().sort({ title: 1 }).toArray();
  return docs.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  await ensureIndexes();
  const doc = await products().findOne({ slug });
  return doc ? toProduct(doc) : null;
}

export async function productsInCategory(category: string): Promise<Product[]> {
  await ensureIndexes();
  const docs = await products().find({ category }).sort({ title: 1 }).toArray();
  return docs.map(toProduct);
}

export async function countProducts(): Promise<number> {
  await ensureIndexes();
  return products().countDocuments();
}

export async function upsertProduct(
  product: Product,
  { originalSlug }: { originalSlug?: string } = {},
) {
  await ensureIndexes();
  const now = new Date();
  const key = originalSlug ?? product.slug;

  // Drop undefined fields so clearing an optional value (e.g. removing the
  // image) actually unsets it instead of writing null over it.
  const set = Object.fromEntries(
    Object.entries({ ...product, updatedAt: now }).filter(
      ([, value]) => value !== undefined,
    ),
  );

  await products().updateOne(
    { slug: key },
    { $set: set, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
}

export async function deleteProduct(slug: string) {
  await ensureIndexes();
  await Promise.all([
    products().deleteOne({ slug }),
    images().deleteOne({ slug }),
  ]);
}

/* ---------------- product images ---------------- */

export async function saveProductImage(
  slug: string,
  contentType: string,
  base64: string,
) {
  await ensureIndexes();
  await images().updateOne(
    { slug },
    { $set: { slug, contentType, data: base64, updatedAt: new Date() } },
    { upsert: true },
  );
}

export async function getProductImage(slug: string) {
  await ensureIndexes();
  return images().findOne({ slug });
}

/** Keeps an existing image attached when a product is renamed. */
export async function renameProductImage(from: string, to: string) {
  await ensureIndexes();
  await images().updateOne({ slug: from }, { $set: { slug: to } });
}

export async function deleteProductImage(slug: string) {
  await ensureIndexes();
  await images().deleteOne({ slug });
}

/* ---------------- orders ---------------- */

export async function createOrder(
  order: Omit<Order, "reference" | "status" | "createdAt">,
): Promise<string> {
  await ensureIndexes();

  // ponytail: reference collisions are astronomically unlikely at this volume;
  // switch to a counter collection if the store ever needs gapless numbering.
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = `TAS-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;
    try {
      await orders().insertOne({
        ...order,
        reference,
        status: "pending",
        createdAt: new Date(),
      });
      return reference;
    } catch (error) {
      const duplicate =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: number }).code === 11000
          : false;
      if (!duplicate) throw error;
    }
  }
  throw new Error("Could not allocate an order reference. Try again.");
}

export async function listOrders({ email }: { email?: string } = {}) {
  await ensureIndexes();
  const filter = email ? { "customer.email": email } : {};
  return orders().find(filter).sort({ createdAt: -1 }).toArray();
}

export async function getOrder(reference: string) {
  await ensureIndexes();
  return orders().findOne({ reference });
}

/**
 * Tracking lookup. Requiring the email is what stops a guessed reference from
 * exposing a stranger's name, phone number and order contents — a five
 * character reference is not a secret.
 */
export async function findOrderForTracking(reference: string, email: string) {
  await ensureIndexes();
  return orders().findOne({
    reference: reference.trim().toUpperCase(),
    "customer.email": email.trim().toLowerCase(),
  });
}

export async function updateOrderStatus(
  reference: string,
  status: OrderStatus,
) {
  await ensureIndexes();
  await orders().updateOne({ reference }, { $set: { status } });
}

/**
 * Records that the account details were emailed. Called only after the SMTP
 * server accepted the message, so the timestamp means "sent", not "attempted".
 * `$inc` keeps the resend count accurate without a read first.
 */
export async function markFulfilled(
  reference: string,
  entry: {
    sentTo: string;
    sentBy: string;
    channel: DeliveryMethod;
    messageId?: string;
  },
) {
  await ensureIndexes();
  await orders().updateOne(
    { reference },
    {
      $set: {
        "fulfillment.sentAt": new Date(),
        "fulfillment.sentTo": entry.sentTo,
        "fulfillment.sentBy": entry.sentBy,
        "fulfillment.channel": entry.channel,
        ...(entry.messageId ? { "fulfillment.messageId": entry.messageId } : {}),
      },
      $inc: { "fulfillment.count": 1 },
    },
  );
}

/* ---------------- payment receipts ---------------- */

export async function saveOrderReceipt(
  reference: string,
  contentType: string,
  base64: string,
) {
  await ensureIndexes();
  await Promise.all([
    receipts().updateOne(
      { reference },
      { $set: { reference, contentType, data: base64, updatedAt: new Date() } },
      { upsert: true },
    ),
    // Denormalised onto the order so the admin list knows a screenshot exists
    // without querying the receipts collection per row.
    orders().updateOne({ reference }, { $set: { receiptContentType: contentType } }),
  ]);
}

export async function getOrderReceipt(reference: string) {
  await ensureIndexes();
  return receipts().findOne({ reference });
}

/* ---------------- users ---------------- */

export async function findUserByEmail(email: string) {
  await ensureIndexes();
  return users().findOne({ email: email.trim().toLowerCase() });
}

export async function createUser(user: Omit<AppUser, "createdAt">) {
  await ensureIndexes();
  await users().insertOne({ ...user, createdAt: new Date() });
}

export async function listUsers() {
  await ensureIndexes();
  return users().find().sort({ createdAt: -1 }).toArray();
}

export async function setUserRole(email: string, role: Role) {
  await ensureIndexes();
  await users().updateOne({ email }, { $set: { role } });
}

/**
 * Removes a staff sign-in account. Returns false when the email is unknown, so
 * the caller can tell the admin the truth instead of reporting a success that
 * did not happen.
 */
export async function deleteUser(email: string) {
  await ensureIndexes();
  const res = await users().deleteOne({ email: email.trim().toLowerCase() });
  return res.deletedCount === 1;
}

/* ---------------- deletions ---------------- */

/** Shown in place of a customer's details once their record is erased. */
export const DELETED_CUSTOMER = {
  name: "Deleted customer",
  email: "deleted@removed.invalid",
  phone: "—",
} as const;

/**
 * Permanently removes an order and the payment screenshot filed against it.
 * The receipt is a separate document keyed by the same reference, so leaving it
 * behind would orphan image data with no order to belong to.
 *
 * Returns false when the reference is unknown, so the UI never claims a
 * deletion that did not happen.
 */
export async function deleteOrder(reference: string) {
  await ensureIndexes();
  const [order] = await Promise.all([
    orders().deleteOne({ reference }),
    receipts().deleteMany({ reference }),
  ]);
  return order.deletedCount === 1;
}

/**
 * Erases a customer's personal details from every order they placed.
 *
 * There are no customer accounts to delete — a customer exists only as the
 * name, email and phone on their orders. Wiping the whole order would destroy
 * the sales record and the payment screenshot the business may still need, so
 * the identifying fields are overwritten and the rest of the order is kept.
 *
 * Tracking stops working for those orders, because `findOrderForTracking`
 * requires the email the customer ordered with and it no longer exists.
 *
 * Returns how many orders were rewritten; zero means no such customer.
 */
export async function anonymiseCustomer(email: string) {
  await ensureIndexes();
  const target = email.trim().toLowerCase();
  if (!target) return 0;

  const res = await orders().updateMany(
    { "customer.email": target },
    { $set: { customer: { ...DELETED_CUSTOMER } }, $unset: { userId: "" } },
  );
  return res.modifiedCount;
}

export async function countUsers() {
  await ensureIndexes();
  return users().countDocuments();
}

export async function countAdmins() {
  await ensureIndexes();
  return users().countDocuments({ role: "admin" });
}

/* ---------------- dashboard ---------------- */

export async function adminStats() {
  await ensureIndexes();
  const [orderList, productCount, staffCount] = await Promise.all([
    orders().find().toArray(),
    countProducts(),
    countUsers(),
  ]);

  const earningStatuses: OrderStatus[] = ["verified", "delivered"];
  const revenue = orderList    .filter((o) => earningStatuses.includes(o.status))
    .reduce((sum, o) => sum + o.total, 0);

  return {
    revenue,
    orders: orderList.length,
    pending: orderList.filter((o) => o.status === "pending").length,
    delivered: orderList.filter((o) => o.status === "delivered").length,
    products: productCount,
    staff: staffCount,
    // Customers are the distinct emails that have ordered — there are no
    // customer accounts, so this is the only place they exist.
    customers: new Set(orderList.map((o) => o.customer.email)).size,
  };
}

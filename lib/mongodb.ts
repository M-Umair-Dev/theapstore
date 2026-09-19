import { setServers } from "node:dns";
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "theapstore";

/*
 * Some ISPs refuse DNS SRV queries, which breaks every `mongodb+srv://` string
 * with `querySrv ECONNREFUSED`. Pointing Node's resolver at public DNS fixes it
 * on those networks. Opt-in via env so it never silently overrides the DNS of a
 * machine that works fine, and so it stays off in production.
 */
const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (dnsServers?.length) {
  setServers(dnsServers);
  console.log(`[mongodb] DNS override active: ${dnsServers.join(", ")}`);
}

// Cached on globalThis so dev hot-reload does not open a new pool each edit.
const globalForMongo = globalThis as typeof globalThis & {
  _mongoClient?: MongoClient;
};

export function getDb(): Db {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.local.example to .env.local and paste " +
        "your MongoDB Atlas connection string into it, then restart the server.",
    );
  }

  if (!globalForMongo._mongoClient) {
    globalForMongo._mongoClient = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
  }

  return globalForMongo._mongoClient.db(dbName);
}

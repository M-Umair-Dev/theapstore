/**
 * Pushes the starter catalogue into MongoDB and creates the first admin.
 * Run with:  npm run seed
 * Safe to re-run — products are upserted by slug, the admin is only created
 * when no admin exists yet.
 */
import { hashPassword } from "../lib/password.ts";
import { countAdmins, createUser, upsertProduct } from "../lib/repo.ts";
import { seedProducts } from "../lib/seed-products.ts";

async function main() {
  console.log(`Seeding ${seedProducts.length} products...`);
  for (const product of seedProducts) {
    await upsertProduct(product);
  }
  console.log("Products seeded.");

  if ((await countAdmins()) > 0) {
    console.log("An admin already exists — skipping admin creation.");
  } else {
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
      throw new Error(
        "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env.local before seeding.",
      );
    }
    if (password.length < 8) {
      throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
    }
    await createUser({
      name: "Store Admin",
      email,
      passwordHash: await hashPassword(password),
      role: "admin",
    });
    console.log(`Admin created: ${email}`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("\nSeed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

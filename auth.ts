import { randomBytes } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/password";
import { findUserByEmail } from "@/lib/repo";

// Verify against a throwaway hash when the email is unknown, so a missing
// account costs the same time as a wrong password.
let dummyHash: string | null = null;
const getDummyHash = async () =>
  (dummyHash ??= await hashPassword(randomBytes(32).toString("hex")));

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Credentials sign-in requires JWT sessions — no adapter, no session table.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        const stored = user?.passwordHash ?? (await getDummyHash());
        const ok = await verifyPassword(password, stored);
        if (!user || !ok) return null;

        return {
          id: user.email,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
<<<<<<< HEAD
        // Type assertion added here to fix the Vercel build error
        session.user.role = token.role as "admin" | "customer";
=======
        // Cast because Auth.js types JWT with an `[key: string]: unknown` index
        // signature — the augmentation in types/next-auth.d.ts does not reach
        // the @auth/core type this callback receives.
        session.user.role = token.role as "admin" | "customer" | undefined;
>>>>>>> d136282 (auth update)
      }
      return session;
    },
  },
});

/** Page guard: sends anonymous visitors to /login and non-admins home. */
export async function requireAdmin(next = "/admin") {
  const session = await auth();
  if (!session?.user) redirect(`/login?next=${next}`);
  if (session.user.role !== "admin") redirect("/");
  return session;
}

/**
 * Server-action guard. Returns null instead of redirecting so the action can
 * hand an error back to the form. Every mutation must call this — a page-level
 * guard alone does not protect an action endpoint.
 */
export async function currentAdmin() {
  const session = await auth();
  return session?.user?.role === "admin" ? session.user : null;
}

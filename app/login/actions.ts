"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string };

/** Only allow same-site paths through the ?next= parameter. */
const safeNext = (value: string) =>
  value.startsWith("/") && !value.startsWith("//") ? value : "/admin";

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/admin"));

  try {
    await signIn("credentials", { email, password, redirectTo: next });
    return {};
  } catch (error) {
    // signIn signals success by throwing a redirect — let that through.
    if (error instanceof AuthError) {
      return { error: "Wrong email or password." };
    }
    throw error;
  }
}

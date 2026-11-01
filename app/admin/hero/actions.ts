"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/auth";
import { getProductBySlug, saveHeroSetting } from "@/lib/repo";

const backTo = (key: string, value: string) =>
  `/admin/hero?${key}=${encodeURIComponent(value)}`;

export async function saveHeroAction(fd: FormData) {
  if (!(await currentAdmin())) redirect("/login?next=/admin/hero");

  const productSlug = String(fd.get("productSlug") ?? "").trim();
  const product = productSlug ? await getProductBySlug(productSlug) : null;
  if (!product) {
    redirect(
      backTo(
        "error",
        "That product is not in the catalogue. Nothing was saved.",
      ),
    );
  }

  await saveHeroSetting(product.slug);
  revalidatePath("/");
  redirect(backTo("saved", "1"));
}

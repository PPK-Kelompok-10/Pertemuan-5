"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PREF_MAX_AGE } from "@/lib/prefs";

/** FR-PREF-01..05: simpan theme dan/atau transactionView ke cookie persisten (bukan session). */
export async function savePreferences(formData: FormData): Promise<void> {
  const theme = formData.get("theme");
  const view = formData.get("transactionView");
  const jar = await cookies();

  // Bukan data sensitif -> sengaja tidak HttpOnly agar bisa dibaca client bila perlu
  const opts = {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PREF_MAX_AGE,
  };

  if (theme === "light" || theme === "dark") jar.set("theme", theme, opts);
  if (view === "list" || view === "grid") jar.set("transactionView", view, opts);

  revalidatePath("/", "layout");
}

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

/** Guard utama (setara middleware `requireAuth` di SRS). Dipakai di layout, page, dan setiap Server Action. */
export const requireUser = cache(async () => {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
});

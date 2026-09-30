import "server-only";
import { cookies } from "next/headers";

export type Theme = "light" | "dark";
export type TransactionView = "list" | "grid";

export const PREF_MAX_AGE = 60 * 60 * 24 * 365; // FR-PREF-05: minimal 1 tahun

/** Cookie adalah source of truth (FR-PREF-06). Nilai tak valid jatuh ke default. */
export async function getPrefs() {
  const jar = await cookies();
  const theme = jar.get("theme")?.value;
  const view = jar.get("transactionView")?.value;
  return {
    theme: (theme === "dark" ? "dark" : "light") as Theme,
    transactionView: (view === "grid" ? "grid" : "list") as TransactionView,
  };
}

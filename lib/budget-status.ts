// Sengaja TANPA "server-only": file ini hanya berisi tipe dan konstanta tampilan
// (tidak menyentuh Prisma), sehingga aman diimpor oleh client component seperti
// BudgetList.tsx. Logika query database ada di lib/budget.ts.

export type BudgetStatus = "aman" | "waspada" | "overspending";

export type BudgetRow = {
  id: string;
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
};

// UC-BUD-03: aturan indikator
export function budgetStatus(percentage: number): BudgetStatus {
  if (percentage >= 100) return "overspending";
  if (percentage >= 70) return "waspada";
  return "aman";
}

export const STATUS_LABEL: Record<BudgetStatus, string> = {
  aman: "Aman",
  waspada: "Waspada",
  overspending: "Overspending",
};

// Warna dipetakan lewat token tema project (lihat app/globals.css), bukan warna Tailwind
// mentah, supaya konsisten dengan mode gelap/terang yang sudah ada.
export const STATUS_CLASS: Record<BudgetStatus, { text: string; bar: string; chip: string }> = {
  aman: { text: "text-income", bar: "bg-income", chip: "border-income text-income" },
  waspada: { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", chip: "border-amber-500 text-amber-600 dark:text-amber-400" },
  overspending: { text: "text-expense", bar: "bg-expense", chip: "border-expense text-expense" },
};

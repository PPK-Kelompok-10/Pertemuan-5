import "server-only";
import { prisma } from "@/lib/prisma";
import { budgetStatus, type BudgetRow } from "@/lib/budget-status";

/**
 * FR-BUD-05/08/10: ringkasan budget vs pengeluaran untuk satu user + satu bulan.
 * `userId` HARUS datang dari session (requireUser), tidak pernah dari input — lihat FR-ISO-01.
 * Pengeluaran dihitung dari tabel `transactions` (FR-EXP-03) dengan mencocokkan
 * `to_char(date, 'YYYY-MM')` terhadap `period`, sehingga tidak perlu kolom relasi baru
 * di Transaction dan transaksi lama tetap otomatis terhitung.
 */
export async function getBudgetSummary(userId: string, period: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId, period },
    orderBy: { category: "asc" },
  });

  const spentRows = await prisma.$queryRaw<{ category: string; spent: string }[]>`
    SELECT "category", COALESCE(SUM("amount"), 0)::text AS spent
    FROM "transactions"
    WHERE "user_id" = ${userId}::uuid
      AND "type" = 'expense'
      AND to_char("date", 'YYYY-MM') = ${period}
    GROUP BY "category"
  `;
  const spentByCategory = new Map(spentRows.map((r) => [r.category, Number(r.spent)]));

  const rows: BudgetRow[] = budgets.map((b) => {
    const budget = b.amount.toNumber();
    const spent = spentByCategory.get(b.category) ?? 0;
    const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    return {
      id: b.id,
      category: b.category,
      budget,
      spent,
      remaining: budget - spent,
      percentage,
      status: budgetStatus(percentage),
    };
  });

  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);

  return {
    rows,
    totalBudget,
    totalSpent,
    totalRemaining: totalBudget - totalSpent,
    totalPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
  };
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getBudgetSummary } from "@/lib/budget";
import { formatIDR } from "@/lib/format";
import BudgetForm from "@/components/BudgetForm";
import BudgetList from "@/components/BudgetList";
import BudgetMonthNav from "@/components/BudgetMonthNav";
import { cardCls } from "@/components/ui";

export const metadata: Metadata = { title: "Budget" };

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// UC-BUD-02/05/06/08 dan FR-BUD-05..10: ringkasan, indikator, dan navigasi bulan untuk satu user.
export default async function BudgetPeriodPage({ params }: { params: Promise<{ period: string }> }) {
  const user = await requireUser();
  const { period } = await params;
  if (!PERIOD_RE.test(period)) notFound(); // FR-ISO-06: input tidak valid diperlakukan seperti data tidak ditemukan

  const summary = await getBudgetSummary(user.id, period); // userId dari session — FR-ISO-01

  return (
    <div className="space-y-8">
      <BudgetMonthNav period={period} />

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className={`${cardCls} p-4`}>
          <dt className="text-sm text-muted">Total budget</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{formatIDR(summary.totalBudget)}</dd>
        </div>
        <div className={`${cardCls} p-4`}>
          <dt className="text-sm text-muted">Total pengeluaran</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-expense">{formatIDR(summary.totalSpent)}</dd>
        </div>
        <div className={`${cardCls} p-4`}>
          <dt className="text-sm text-muted">Sisa</dt>
          <dd className={`mt-1 text-xl font-semibold tabular-nums ${summary.totalRemaining < 0 ? "text-expense" : ""}`}>
            {formatIDR(summary.totalRemaining)}
          </dd>
        </div>
      </dl>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <section aria-labelledby="add-budget" className={`${cardCls} h-fit p-5`}>
          <h2 id="add-budget" className="mb-4 text-lg font-semibold">
            Tambah budget
          </h2>
          <BudgetForm period={period} />
        </section>

        <section aria-labelledby="budget-list" className="space-y-4">
          <h2 id="budget-list" className="text-lg font-semibold">
            Budget per kategori
          </h2>
          <BudgetList rows={summary.rows} period={period} />
        </section>
      </div>
    </div>
  );
}

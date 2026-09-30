import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getBudgetSummary } from "@/lib/budget";
import { STATUS_CLASS, STATUS_LABEL } from "@/lib/budget-status";
import { currentPeriodWIB, formatIDR } from "@/lib/format";
import TransactionList from "@/components/TransactionList";
import { btnGhost, cardCls } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const period = currentPeriodWIB();

  const [sums, recent, budgetSummary] = await Promise.all([
    prisma.transaction.groupBy({ by: ["type"], where: { userId: user.id }, _sum: { amount: true } }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    getBudgetSummary(user.id, period), // UC-BUD-02: budget summary juga tampil di dashboard
  ]);

  const total = (t: "income" | "expense") => sums.find((s) => s.type === t)?._sum.amount?.toNumber() ?? 0;
  const income = total("income");
  const expense = total("expense");
  const balance = income - expense;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Halo, {user.nama}</h1>
        <p className="text-sm text-muted">Ringkasan seluruh transaksi Anda.</p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className={`${cardCls} p-4`}>
          <dt className="text-sm text-muted">Saldo</dt>
          <dd className={`mt-1 text-2xl font-semibold tabular-nums ${balance < 0 ? "text-expense" : ""}`}>{formatIDR(balance)}</dd>
        </div>
        <div className={`${cardCls} p-4`}>
          <dt className="text-sm text-muted">Total pemasukan</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-income">{formatIDR(income)}</dd>
        </div>
        <div className={`${cardCls} p-4`}>
          <dt className="text-sm text-muted">Total pengeluaran</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-expense">{formatIDR(expense)}</dd>
        </div>
      </dl>

      <section aria-labelledby="budget-summary" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="budget-summary" className="text-lg font-semibold">
            Budget bulan ini
          </h2>
          <Link href={`/budgets/${period}`} className={btnGhost}>
            Kelola budget
          </Link>
        </div>
        {budgetSummary.rows.length === 0 ? (
          <p className={`${cardCls} p-6 text-sm text-muted`}>Belum ada budget bulan ini.</p>
        ) : (
          <ul className={`${cardCls} divide-y divide-line`}>
            {budgetSummary.rows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-medium">{row.category}</span>
                <span className="flex items-center gap-2 text-sm text-muted">
                  {formatIDR(row.spent)} / {formatIDR(row.budget)}
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[row.status].chip}`}>
                    {STATUS_LABEL[row.status]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="recent" className="text-lg font-semibold">
            Transaksi terbaru
          </h2>
          <Link href="/transactions" className={btnGhost}>
            Kelola transaksi
          </Link>
        </div>
        <TransactionList
          view="list"
          items={recent.map((t) => ({ ...t, amount: t.amount.toNumber() }))}
        />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatIDR } from "@/lib/format";
import TransactionList from "@/components/TransactionList";
import { btnGhost, cardCls } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  const [sums, recent] = await Promise.all([
    prisma.transaction.groupBy({ by: ["type"], where: { userId: user.id }, _sum: { amount: true } }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { budgetStatus, STATUS_CLASS, STATUS_LABEL } from "@/lib/budget-status";
import { formatDate, formatIDR, formatPeriod } from "@/lib/format";
import { btnGhost, cardCls } from "@/components/ui";

export const metadata: Metadata = { title: "Detail Budget" };

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// UC-BUD-07: transaksi expense pada kategori + bulan sebuah budget, plus total dan jumlah transaksi.
export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ period: string; category: string }>;
}) {
  const user = await requireUser();
  const { period, category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  if (!PERIOD_RE.test(period)) notFound();

  // FR-ISO-03/06: budget yang tidak ada atau bukan milik user ini -> 404, bukan pesan "milik user lain"
  const budget = await prisma.budget.findFirst({
    where: { userId: user.id, category, period },
  });
  if (!budget) notFound();

  const items = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      type: "expense",
      category,
      date: { gte: new Date(`${period}-01T00:00:00.000Z`), lt: new Date(`${nextMonth(period)}-01T00:00:00.000Z`) },
    },
    orderBy: { date: "desc" },
  });

  const amount = budget.amount.toNumber();
  const spent = items.reduce((s, t) => s + t.amount.toNumber(), 0);
  const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;
  const status = budgetStatus(percentage);
  const cls = STATUS_CLASS[status];

  return (
    <div className="space-y-6">
      <Link href={`/budgets/${period}`} className={btnGhost}>
        ← Kembali ke {formatPeriod(period)}
      </Link>

      <div className={`${cardCls} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">{category}</h1>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls.chip}`}>{STATUS_LABEL[status]}</span>
        </div>
        <p className="mt-1 text-sm text-muted capitalize">{formatPeriod(period)}</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted">Budget</dt>
            <dd className="text-lg font-semibold tabular-nums">{formatIDR(amount)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Terpakai</dt>
            <dd className={`text-lg font-semibold tabular-nums ${cls.text}`}>
              {formatIDR(spent)} ({percentage}%)
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Jumlah transaksi</dt>
            <dd className="text-lg font-semibold tabular-nums">{items.length}</dd>
          </div>
        </dl>
      </div>

      <section aria-labelledby="tx-list" className="space-y-3">
        <h2 id="tx-list" className="text-lg font-semibold">
          Transaksi pengeluaran
        </h2>
        {items.length === 0 ? (
          <p className={`${cardCls} p-6 text-sm text-muted`}>Belum ada transaksi pengeluaran untuk kategori ini di bulan ini.</p>
        ) : (
          <ul className={`${cardCls} divide-y divide-line`}>
            {items.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-muted">
                    <time dateTime={t.date.toISOString().slice(0, 10)}>{formatDate(t.date)}</time>
                    {t.description ? ` — ${t.description}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-expense">− {formatIDR(t.amount.toNumber())}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function nextMonth(period: string) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

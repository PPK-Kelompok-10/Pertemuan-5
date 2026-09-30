import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getPrefs } from "@/lib/prefs";
import { savePreferences } from "@/app/actions/preferences";
import { todayWIB } from "@/lib/format";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import { btnGhost, cardCls } from "@/components/ui";

export const metadata: Metadata = { title: "Transaksi" };

const FILTERS = [
  { value: undefined, label: "Semua", href: "/transactions" },
  { value: "income", label: "Pemasukan", href: "/transactions?type=income" },
  { value: "expense", label: "Pengeluaran", href: "/transactions?type=expense" },
] as const;

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requireUser();
  const { type: rawType } = await searchParams;
  const type = rawType === "income" || rawType === "expense" ? rawType : undefined;
  const { transactionView } = await getPrefs();

  const items = await prisma.transaction.findMany({
    where: { userId: user.id, ...(type ? { type } : {}) }, // isolasi data: selalu difilter userId
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  const nextView = transactionView === "list" ? "grid" : "list";

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <section aria-labelledby="add" className={`${cardCls} h-fit p-5`}>
        <h2 id="add" className="mb-4 text-lg font-semibold">
          Tambah transaksi
        </h2>
        <TransactionForm today={todayWIB()} />
      </section>

      <section aria-labelledby="list" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 id="list" className="text-lg font-semibold">
            Daftar transaksi
          </h1>
          <form action={savePreferences}>
            <input type="hidden" name="transactionView" value={nextView} />
            <button type="submit" className={btnGhost}>
              Tampilan: {nextView === "grid" ? "kartu" : "daftar"}
            </button>
          </form>
        </div>

        <nav aria-label="Filter jenis transaksi" className="flex gap-2">
          {FILTERS.map((f) => {
            const active = f.value === type;
            return (
              <Link
                key={f.label}
                href={f.href}
                aria-current={active ? "true" : undefined}
                className={`rounded-md border px-3 py-1.5 text-sm ${active ? "border-brand bg-brand text-brand-ink" : "border-line text-muted hover:text-ink"}`}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>

        <TransactionList view={transactionView} items={items.map((t) => ({ ...t, amount: t.amount.toNumber() }))} />
      </section>
    </div>
  );
}

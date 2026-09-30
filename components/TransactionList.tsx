import { deleteTransactionAction } from "@/app/actions/transactions";
import { formatDate, formatIDR } from "@/lib/format";
import type { TransactionView } from "@/lib/prefs";
import DeleteButton from "./DeleteButton";
import { cardCls } from "./ui";

export type TxItem = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string | null;
  date: Date;
};

function Amount({ t }: { t: TxItem }) {
  const income = t.type === "income";
  return (
    <span className={`font-semibold tabular-nums ${income ? "text-income" : "text-expense"}`}>
      {income ? "+" : "−"} {formatIDR(t.amount)}
    </span>
  );
}

export default function TransactionList({ items, view }: { items: TxItem[]; view: TransactionView }) {
  if (items.length === 0) {
    return <p className={`${cardCls} p-6 text-sm text-muted`}>Belum ada transaksi. Tambahkan yang pertama lewat formulir.</p>;
  }

  if (view === "grid") {
    return (
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((t) => (
          <li key={t.id} className={`${cardCls} flex flex-col gap-2 p-4`}>
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium">{t.category}</span>
              <Amount t={t} />
            </div>
            {t.description && <p className="text-sm text-muted">{t.description}</p>}
            <div className="mt-auto flex items-center justify-between pt-1 text-sm text-muted">
              <time dateTime={t.date.toISOString().slice(0, 10)}>{formatDate(t.date)}</time>
              <DeleteButton action={deleteTransactionAction.bind(null, t.id)} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={`${cardCls} divide-y divide-line`}>
      {items.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{t.category}</p>
            <p className="truncate text-sm text-muted">
              <time dateTime={t.date.toISOString().slice(0, 10)}>{formatDate(t.date)}</time>
              {t.description ? ` — ${t.description}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <Amount t={t} />
            <DeleteButton action={deleteTransactionAction.bind(null, t.id)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

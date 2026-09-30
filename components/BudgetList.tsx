"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteBudgetAction } from "@/app/actions/budgets";
import { formatIDR } from "@/lib/format";
import { STATUS_CLASS, STATUS_LABEL, type BudgetRow } from "@/lib/budget-status";
import BudgetEditForm from "./BudgetEditForm";
import DeleteButton from "./DeleteButton";
import { cardCls } from "./ui";

function ProgressBar({ percentage, barClass }: { percentage: number; barClass: string }) {
  const clamped = Math.min(100, Math.max(0, percentage));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full ${barClass}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

function Row({ row, period }: { row: BudgetRow; period: string }) {
  const [editing, setEditing] = useState(false);
  const cls = STATUS_CLASS[row.status];

  if (editing) {
    return (
      <li className="p-4">
        <BudgetEditForm id={row.id} period={period} amount={row.budget} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="space-y-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/budgets/${period}/${encodeURIComponent(row.category)}`} className="font-medium underline-offset-2 hover:underline">
          {row.category}
        </Link>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls.chip}`}>{STATUS_LABEL[row.status]}</span>
      </div>

      <ProgressBar percentage={row.percentage} barClass={cls.bar} />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>
          {formatIDR(row.spent)} / {formatIDR(row.budget)}
        </span>
        <span className={row.remaining < 0 ? "text-expense" : ""}>
          {row.remaining < 0 ? "Lebih " : "Sisa "}
          {formatIDR(Math.abs(row.remaining))} · {row.percentage}%
        </span>
      </div>

      <div className="flex gap-4 pt-1">
        <button type="button" onClick={() => setEditing(true)} className="text-sm underline-offset-2 hover:underline">
          Edit
        </button>
        <DeleteButton
          action={deleteBudgetAction.bind(null, row.id, period)}
          confirmMessage="Hapus budget ini? Transaksi terkait tidak akan terhapus."
        />
      </div>
    </li>
  );
}

export default function BudgetList({ rows, period }: { rows: BudgetRow[]; period: string }) {
  if (rows.length === 0) {
    return <p className={`${cardCls} p-6 text-sm text-muted`}>Belum ada budget bulan ini. Tambahkan lewat formulir.</p>;
  }

  return (
    <ul className={`${cardCls} divide-y divide-line`}>
      {rows.map((row) => (
        <Row key={row.id} row={row} period={period} />
      ))}
    </ul>
  );
}

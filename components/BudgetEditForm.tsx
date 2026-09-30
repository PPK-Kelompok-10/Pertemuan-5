"use client";

import { useActionState, useEffect, useId } from "react";
import { updateBudgetAction } from "@/app/actions/budgets";
import type { FormState } from "@/lib/form-state";
import { btnGhost, btnPrimary, inputCls } from "./ui";

// UC-BUD-05: hanya nominal yang bisa diubah — kategori & bulan ditampilkan sebagai teks statis.
export default function BudgetEditForm({ id, period, amount, onDone }: { id: string; period: string; amount: number; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateBudgetAction, {} as FormState);
  const fieldId = useId();

  useEffect(() => {
    if (state.ok) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 rounded-md border border-line bg-page p-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="period" value={period} />
      <div className="space-y-1">
        <label htmlFor={fieldId} className="text-sm font-medium">
          Nominal baru (Rp)
        </label>
        <input id={fieldId} name="amount" type="number" min={1} step={1} required defaultValue={amount} className={inputCls} />
        {state.errors?.amount && <p className="text-sm text-expense">{state.errors.amount[0]}</p>}
      </div>
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Menyimpan…" : "Simpan"}
      </button>
      <button type="button" onClick={onDone} className={btnGhost}>
        Batal
      </button>
    </form>
  );
}

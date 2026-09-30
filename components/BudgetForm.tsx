"use client";

import { useActionState } from "react";
import { createBudgetAction } from "@/app/actions/budgets";
import type { FormState } from "@/lib/form-state";
import Field from "./Field";
import { btnPrimary, inputCls } from "./ui";

const CATEGORIES = ["Makan", "Transport", "Kos", "Belanja", "Hiburan", "Pendidikan", "Lainnya"];

export default function BudgetForm({ period }: { period: string }) {
  const [state, action, pending] = useActionState(createBudgetAction, {} as FormState);

  return (
    <form action={action} className="space-y-4">
      {state.ok && (
        <p role="status" className="rounded-md border border-income px-3 py-2 text-sm text-income">
          {state.message}
        </p>
      )}
      <input type="hidden" name="period" value={period} />

      <div className="space-y-1.5">
        <label htmlFor="budget-category" className="text-sm font-medium">
          Kategori
        </label>
        <input
          id="budget-category"
          name="category"
          list="budget-category-list"
          required
          maxLength={40}
          defaultValue={state.values?.category}
          aria-invalid={state.errors?.category ? true : undefined}
          className={inputCls}
        />
        <datalist id="budget-category-list">
          {CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {state.errors?.category && <p className="text-sm text-expense">{state.errors.category[0]}</p>}
      </div>

      <Field label="Nominal budget (Rp)" name="amount" type="number" inputMode="numeric" min={1} step={1} required defaultValue={state.values?.amount} error={state.errors?.amount} />

      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? "Menyimpan…" : "Simpan budget"}
      </button>
    </form>
  );
}

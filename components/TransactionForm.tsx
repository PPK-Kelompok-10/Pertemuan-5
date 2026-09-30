"use client";

import { useActionState } from "react";
import { createTransactionAction } from "@/app/actions/transactions";
import type { FormState } from "@/lib/form-state";
import Field from "./Field";
import { btnPrimary, inputCls } from "./ui";

const CATEGORIES = ["Makan", "Transport", "Kos", "Belanja", "Hiburan", "Pendidikan", "Uang saku", "Gaji", "Freelance", "Lainnya"];

const seg =
  "block cursor-pointer rounded-md border border-line px-3 py-2 text-center text-sm text-muted peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand";

export default function TransactionForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(createTransactionAction, {} as FormState);
  const type = state.values?.type ?? "expense";

  return (
    <form action={action} className="space-y-4">
      {state.ok && (
        <p role="status" className="rounded-md border border-income px-3 py-2 text-sm text-income">
          {state.message}
        </p>
      )}

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Jenis</legend>
        <div className="grid grid-cols-2 gap-2">
          <label>
            <input type="radio" name="type" value="expense" defaultChecked={type === "expense"} className="peer sr-only" />
            <span className={`${seg} peer-checked:border-expense peer-checked:font-semibold peer-checked:text-expense`}>Pengeluaran</span>
          </label>
          <label>
            <input type="radio" name="type" value="income" defaultChecked={type === "income"} className="peer sr-only" />
            <span className={`${seg} peer-checked:border-income peer-checked:font-semibold peer-checked:text-income`}>Pemasukan</span>
          </label>
        </div>
        {state.errors?.type && <p className="text-sm text-expense">{state.errors.type[0]}</p>}
      </fieldset>

      <Field label="Jumlah (Rp)" name="amount" type="number" inputMode="numeric" min={1} step={1} required defaultValue={state.values?.amount} error={state.errors?.amount} />

      <div className="space-y-1.5">
        <label htmlFor="category" className="text-sm font-medium">
          Kategori
        </label>
        <input id="category" name="category" list="category-list" required maxLength={40} defaultValue={state.values?.category} aria-invalid={state.errors?.category ? true : undefined} className={inputCls} />
        <datalist id="category-list">
          {CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {state.errors?.category && <p className="text-sm text-expense">{state.errors.category[0]}</p>}
      </div>

      <Field label="Tanggal" name="date" type="date" required defaultValue={state.values?.date ?? today} error={state.errors?.date} />
      <Field label="Catatan (opsional)" name="description" maxLength={200} defaultValue={state.values?.description} error={state.errors?.description} />

      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? "Menyimpan…" : "Simpan transaksi"}
      </button>
    </form>
  );
}

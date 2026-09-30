"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import type { FormState } from "@/lib/form-state";
import Field from "./Field";
import { btnPrimary } from "./ui";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {} as FormState);

  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <p role="alert" className="rounded-md border border-expense px-3 py-2 text-sm text-expense">
          {state.message}
        </p>
      )}
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} error={state.errors?.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required error={state.errors?.password} />
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? "Memproses…" : "Masuk"}
      </button>
      <p className="text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-ink underline">
          Daftar
        </Link>
      </p>
    </form>
  );
}

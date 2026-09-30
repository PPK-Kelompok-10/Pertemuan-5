"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import type { FormState } from "@/lib/form-state";
import Field from "./Field";
import { btnPrimary } from "./ui";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, {} as FormState);
  const [mismatch, setMismatch] = useState(false);

  return (
    <form
      action={action}
      className="space-y-4"
      onSubmit={(e) => {
        // validasi client-side: konfirmasi password (server tetap memeriksa ulang)
        const fd = new FormData(e.currentTarget);
        if (fd.get("password") !== fd.get("konfirmasiPassword")) {
          e.preventDefault();
          setMismatch(true);
        } else setMismatch(false);
      }}
    >
      <Field label="Nama" name="nama" autoComplete="name" required maxLength={80} defaultValue={state.values?.nama} error={state.errors?.nama} />
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} error={state.errors?.email} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} error={state.errors?.password} />
      <Field
        label="Konfirmasi password"
        name="konfirmasiPassword"
        type="password"
        autoComplete="new-password"
        required
        error={mismatch ? ["Konfirmasi password tidak sama"] : state.errors?.konfirmasiPassword}
      />
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? "Membuat akun…" : "Buat akun"}
      </button>
      <p className="text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-ink underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}

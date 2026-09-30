import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const { registered } = await searchParams;
  return (
    <>
      <h1 className="mb-4 text-lg font-semibold">Masuk ke akun</h1>
      {registered && (
        <p role="status" className="mb-4 rounded-md border border-income px-3 py-2 text-sm text-income">
          Akun berhasil dibuat. Silakan masuk.
        </p>
      )}
      <LoginForm />
    </>
  );
}

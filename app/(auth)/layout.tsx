import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getSessionUser()) redirect("/dashboard"); // user yang sudah login tidak perlu melihat /login
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-md content-center px-4 py-10">
      <div className="mb-6">
        <p className="text-xl font-semibold">Expense Tracker</p>
        <p className="text-sm text-muted">Catat pemasukan dan pengeluaran tanpa ribet.</p>
      </div>
      <div className="rounded-lg border border-line bg-surface p-6">{children}</div>
    </main>
  );
}

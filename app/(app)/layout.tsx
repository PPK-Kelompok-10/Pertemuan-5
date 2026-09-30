import Navbar from "@/components/Navbar";
import { requireUser } from "@/lib/auth";
import { getPrefs } from "@/lib/prefs";

// Semua halaman di grup (app) terlindungi di sini (validasi session ke DB)
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { theme } = await getPrefs();
  return (
    <>
      <Navbar user={user} theme={theme} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}

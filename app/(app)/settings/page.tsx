import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getPrefs } from "@/lib/prefs";
import { savePreferences } from "@/app/actions/preferences";
import { btnPrimary, cardCls } from "@/components/ui";

export const metadata: Metadata = { title: "Pengaturan" };

function Choice({ name, value, label, checked }: { name: string; value: string; label: string; checked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="radio" name={name} value={value} defaultChecked={checked} className="accent-[var(--brand)]" />
      {label}
    </label>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const { theme, transactionView } = await getPrefs();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Pengaturan</h1>

      <section className={`${cardCls} p-5`}>
        <h2 className="mb-3 text-lg font-semibold">Akun</h2>
        <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
          <dt className="text-muted">Nama</dt>
          <dd>{user.nama}</dd>
          <dt className="text-muted">Email</dt>
          <dd>{user.email}</dd>
        </dl>
      </section>

      <form action={savePreferences} className={`${cardCls} space-y-5 p-5`}>
        <h2 className="text-lg font-semibold">Preferensi</h2>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">Tema</legend>
          <Choice name="theme" value="light" label="Terang" checked={theme === "light"} />
          <Choice name="theme" value="dark" label="Gelap" checked={theme === "dark"} />
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">Tampilan transaksi</legend>
          <Choice name="transactionView" value="list" label="Daftar" checked={transactionView === "list"} />
          <Choice name="transactionView" value="grid" label="Kartu" checked={transactionView === "grid"} />
        </fieldset>
        <button type="submit" className={btnPrimary}>
          Simpan preferensi
        </button>
        <p className="text-sm text-muted">Preferensi disimpan di cookie browser ini selama 1 tahun.</p>
      </form>
    </div>
  );
}

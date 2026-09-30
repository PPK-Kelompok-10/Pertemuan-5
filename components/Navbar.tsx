import { logoutAction } from "@/app/actions/auth";
import { savePreferences } from "@/app/actions/preferences";
import type { Theme } from "@/lib/prefs";
import NavLinks from "./NavLinks";
import { btnGhost } from "./ui";

export default function Navbar({ user, theme }: { user: { nama: string; email: string }; theme: Theme }) {
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold">Expense Tracker</span>
          <NavLinks />
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted sm:inline" title={user.email}>
            {user.nama}
          </span>
          <form action={savePreferences}>
            <input type="hidden" name="theme" value={next} />
            <button type="submit" className={btnGhost}>
              {theme === "dark" ? "Mode terang" : "Mode gelap"}
            </button>
          </form>
          <form action={logoutAction}>
            <button type="submit" className={btnGhost}>
              Keluar
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import { formatPeriod, shiftPeriod } from "@/lib/format";
import { btnGhost } from "./ui";

// UC-BUD-04: navigasi antar bulan lewat URL /budgets/[period] (bisa di-bookmark/refresh).
export default function BudgetMonthNav({ period }: { period: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link href={`/budgets/${shiftPeriod(period, -1)}`} className={btnGhost} aria-label="Bulan sebelumnya">
        ← Sebelumnya
      </Link>
      <h1 className="text-lg font-semibold capitalize">{formatPeriod(period)}</h1>
      <Link href={`/budgets/${shiftPeriod(period, 1)}`} className={btnGhost} aria-label="Bulan berikutnya">
        Berikutnya →
      </Link>
    </div>
  );
}

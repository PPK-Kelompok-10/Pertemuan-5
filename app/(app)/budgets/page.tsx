import { redirect } from "next/navigation";
import { currentPeriodWIB } from "@/lib/format";

// UC-BUD-04: default bulan = bulan sekarang. Halaman ini hanya redirect ke URL bulan aktif
// supaya bulan tercermin di URL dan bisa di-bookmark/di-refresh tanpa kehilangan posisi.
export default function BudgetsIndexPage() {
  redirect(`/budgets/${currentPeriodWIB()}`);
}

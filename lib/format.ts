const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
export const formatIDR = (n: number) => idr.format(n);

// Kolom `date` bertipe DATE disimpan sebagai UTC 00:00, jadi format juga dengan timeZone UTC
const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "UTC" });
export const formatDate = (d: Date) => dateFmt.format(d);

/** YYYY-MM-DD untuk hari ini di zona waktu WIB (default value input tanggal) */
export const todayWIB = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(new Date());

/** YYYY-MM untuk bulan ini di zona waktu WIB (UC-BUD-04: default bulan = bulan sekarang) */
export const currentPeriodWIB = () => todayWIB().slice(0, 7);

const periodLabelFmt = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

/** "2026-09" -> "September 2026" */
export const formatPeriod = (period: string) => periodLabelFmt.format(new Date(`${period}-01T00:00:00.000Z`));

/** Geser period sejumlah bulan, mis. shiftPeriod("2026-01", -1) -> "2025-12" */
export function shiftPeriod(period: string, delta: number) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

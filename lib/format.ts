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

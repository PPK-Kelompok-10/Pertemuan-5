import { z } from "zod";

// Dipakai di SERVER (Server Action). Aturan HTML di form (required/minLength/type) hanya lapis UX di client.

export const registerSchema = z
  .object({
    nama: z.string().trim().min(1, "Nama wajib diisi").max(80, "Nama maksimal 80 karakter"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid")
      .max(254, "Email terlalu panjang"),
    // bcrypt hanya memproses 72 byte pertama, jadi batasi agar tidak menyesatkan
    password: z.string().min(8, "Password minimal 8 karakter").max(72, "Password maksimal 72 karakter"),
    konfirmasiPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((d) => d.password === d.konfirmasiPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["konfirmasiPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

const isRealDate = (v: string) => {
  const d = new Date(`${v}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

// FR-BUD-01/03: kategori + bulan (YYYY-MM), nominal > 0. `period` divalidasi format
// saja di sini — keberadaan bulan valid (mis. bukan "2026-13") tidak dicek karena
// period hanya dipakai sebagai kunci pengelompokan, bukan tanggal kalender asli.
export const budgetSchema = z.object({
  category: z.string().trim().min(1, "Kategori wajib diisi").max(40, "Kategori maksimal 40 karakter"),
  amount: z.coerce
    .number()
    .int("Jumlah harus bilangan bulat (rupiah)")
    .positive("Jumlah harus lebih dari 0")
    .max(999_999_999_999, "Jumlah terlalu besar"),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Bulan tidak valid"),
});

// UC-BUD-05: kategori dan bulan tidak boleh diubah saat edit, hanya nominal.
export const budgetUpdateSchema = z.object({
  amount: budgetSchema.shape.amount,
});

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce
    .number()
    .int("Jumlah harus bilangan bulat (rupiah)")
    .positive("Jumlah harus lebih dari 0")
    .max(999_999_999_999, "Jumlah terlalu besar"),
  category: z.string().trim().min(1, "Kategori wajib diisi").max(40, "Kategori maksimal 40 karakter"),
  description: z.string().trim().max(200, "Catatan maksimal 200 karakter"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid")
    .refine(isRealDate, "Tanggal tidak valid"),
});

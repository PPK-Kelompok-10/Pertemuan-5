# Expense Tracker — Aplikasi Manajemen Keuangan Pribadi

Next.js (App Router) + TypeScript + Tailwind + Prisma 6 + Supabase PostgreSQL.
Auth, session, dan cookie preferensi dibuat sendiri (tanpa Supabase Auth) sesuai SRS v2.0.

## Fitur
- Register / login / logout, session persisten 7 hari (tersimpan di tabel `sessions`)
- Proteksi `/dashboard`, `/transactions`, `/settings`, `/budgets`
- Cookie preferensi `theme` (light/dark) dan `transactionView` (list/grid), berlaku 1 tahun
- Dashboard: total pemasukan, total pengeluaran, saldo, budget bulan ini, 5 transaksi terbaru
- Tambah, lihat, filter (semua/pemasukan/pengeluaran), hapus transaksi
- **Budget bulanan per kategori** (SRS "Modul Budget Bulanan & Pengeluaran" v1.0): set/edit/hapus budget, ringkasan budget vs pengeluaran, indikator aman/waspada/overspending, navigasi antar bulan, detail transaksi per budget
- Data transaksi dan budget terisolasi per user

## Struktur file
```
prisma/
  schema.prisma                      skema tabel (users, sessions, transactions, budgets)
  migrations/…_init                  SQL pembuatan tabel awal
  migrations/…_hardening_rls         CHECK amount > 0, RLS
  migrations/…_add_budgets           SQL tabel budgets (unique kategori+bulan, CHECK, RLS)
  seed.ts                            akun demo + budget contoh bulan berjalan
proxy.ts                             penjaga route (lapis 1, cek cookie)
lib/                                 prisma, session, auth (requireUser), prefs, validation, rate-limit, format
lib/budget.ts                        perhitungan ringkasan budget vs pengeluaran + status indikator
app/actions/                         Server Actions: auth, transactions, preferences, budgets
app/(auth)/login, register           halaman guest
app/(app)/dashboard, transactions, settings   halaman terproteksi
app/(app)/budgets/[period]           ringkasan + form + daftar budget satu bulan
app/(app)/budgets/[period]/[category] detail budget: transaksi pengeluaran kategori tsb
components/                          form, daftar transaksi, navbar, form/daftar budget
next.config.ts                       security headers (padanan Helmet)
```

## Setup

### 1. Prasyarat
Node.js 20+ dan pnpm. Struktur proyek mengikuti template tanpa folder `src/` (folder `app/` langsung di root). Alias `@/*` di `tsconfig.json` menunjuk ke root proyek, jadi `@/lib/prisma` = `./lib/prisma`.

### 2. Pasang dependensi
Jalankan di root proyek:
```bash
pnpm add @prisma/client@6 bcryptjs zod server-only
pnpm add -D prisma@6 tsx
```
Prisma sengaja dikunci ke **v6** (konfigurasi `schema.prisma` di repo ini memakai format v6; Prisma 7 memakai format berbeda).
Template Anda punya `pnpm-workspace.yaml`. Jika pnpm menampilkan "Ignored build scripts", jalankan `pnpm approve-builds` dan pilih semua (`prisma`, `@prisma/client`, `@prisma/engines`, `esbuild`); pnpm akan menuliskannya ke `pnpm-workspace.yaml`.

### 3. Salin file
Salin semua file dari paket ini ke root proyek Anda dan **timpa** file bawaan:
`app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `next.config.ts`.

### 4. Edit `package.json`
Tambahkan/ubah:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 5. Buat project Supabase
1. Buka https://supabase.com → **New project**, catat password database.
2. Klik **Connect** (atau Project Settings → Database) dan salin dua connection string:
   - **Transaction pooler** (port 6543) → `DATABASE_URL`
   - **Direct connection** (port 5432) → `DIRECT_URL`. Jika jaringan Anda hanya IPv4 dan koneksi gagal, pakai **Session pooler** (port 5432 di host pooler).

### 6. Isi environment
```bash
cp .env.example .env
```
Isi `DATABASE_URL` dan `DIRECT_URL` di `.env`.

> Prisma CLI **hanya membaca `.env`**, bukan `.env.local`. Next.js membaca keduanya, jadi cukup satu file `.env`.
> Pastikan `.env` tidak ikut ter-commit (default `.gitignore` Next.js sudah mengabaikan `.env*`; tambahkan baris `!.env.example` agar contoh env tetap ter-commit).

### 7. Jalankan migrasi (tabel + constraint + RLS) dan seed
```bash
pnpm prisma generate
pnpm db:migrate
pnpm db:seed
```
`db:migrate` menjalankan tiga SQL di `prisma/migrations/` (dua migrasi awal, satu migrasi `add_budgets`). Jika ingin menjalankan manual, tempel isinya berurutan di Supabase → SQL Editor.

> **Proyek yang sudah pernah `db:migrate` sebelumnya** (tabel `users`/`sessions`/`transactions` sudah ada): cukup jalankan `pnpm prisma generate` lalu `pnpm db:migrate` lagi — Prisma hanya menerapkan migrasi baru (`…_add_budgets`) yang belum tercatat di tabel `_prisma_migrations`, migrasi lama tidak diulang.

### 8. Jalankan aplikasi
```bash
pnpm dev
```
Buka http://localhost:3000.

## Info login

| Actor | Cara akses | Email | Password |
|---|---|---|---|
| Guest | Tanpa login; hanya `/login` dan `/register` | – | – |
| User (demo) | Dibuat oleh `pnpm db:seed`, berisi 5 transaksi dan 3 budget contoh bulan berjalan (Kos/Makan/Transport, masing-masing overspending/waspada/aman) | `demo@example.com` | `Demo12345!` |
| User baru | Daftar sendiri di `/register` | bebas | minimal 8 karakter |

Tidak ada role admin (SRS bagian 2.5 dan 1.2).

## Validasi

**Client-side** (kenyamanan saja, bisa dilewati):
- Atribut HTML: `required`, `type="email"`, `minLength`/`maxLength`, `type="number" min=1`, `type="date"`
- Register: pengecekan konfirmasi password sebelum form dikirim
- Tombol hapus meminta konfirmasi

**Server-side** (yang mengikat; `lib/validation.ts` memakai Zod, dijalankan di setiap Server Action):
- Register: semua field wajib, email valid dan unik (termasuk penanganan race condition lewat unique constraint), password 8–72 karakter, konfirmasi harus sama, password di-hash bcrypt (cost 12)
- Login: pesan generik "Email atau password salah" (tidak membocorkan email terdaftar), rate limit 5 percobaan / 15 menit per IP+email, token session baru tiap login
- Transaksi: `type` hanya `income`/`expense`, jumlah bilangan bulat > 0, kategori 1–40 karakter, catatan ≤ 200 karakter, tanggal harus tanggal kalender yang nyata
- Otorisasi: `userId` selalu diambil dari session, bukan dari form; hapus/ubah memakai `deleteMany`/`updateMany({ where: { id, userId } })` sehingga data milik user lain tidak bisa diubah atau dihapus
- Budget: nominal bilangan bulat > 0, kategori 1–40 karakter, bulan harus format `YYYY-MM` valid; kombinasi kategori + bulan tidak boleh duplikat per user (dicek di kode lewat unique constraint, dan sebagai pagar kedua di database lewat `@@unique([userId, category, period])`); saat edit, kategori dan bulan tidak bisa diubah (hanya nominal, sesuai SRS UC-BUD-05); akses budget yang tidak ada atau bukan milik user → 404 (FR-ISO-06), bukan pesan error yang membocorkan bahwa data itu milik orang lain
- Database: `CHECK (amount > 0)` di `transactions` dan `budgets`, `CHECK` format `period`, foreign key `ON DELETE CASCADE`, email `UNIQUE`, `(userId, category, period)` `UNIQUE` di `budgets`

## Keamanan yang diterapkan (setara SRS)
| SRS | Implementasi di Next.js |
|---|---|
| `prisma-session-store` | Tabel `sessions` + `lib/session.ts`. Cookie `sid` berisi token acak; DB hanya menyimpan hash SHA-256-nya |
| Cookie HttpOnly, SameSite, Secure | `httpOnly`, `sameSite: "lax"`, `secure` di production |
| CSRF token | Server Action hanya menerima POST dan Next.js memverifikasi header `Origin` = `Host`, ditambah `SameSite=Lax` |
| Helmet | Security headers di `next.config.ts` |
| Middleware `requireAuth` | `proxy.ts` (cek cookie) + `requireUser()` (cek session ke DB) di layout dan setiap action |
| Rate limit | `lib/rate-limit.ts` (in-memory, lihat catatan di bawah) |

## Tentang RLS
Aplikasi ini tidak memakai Supabase Auth dan tidak memakai Supabase Data API. Prisma tersambung sebagai role `postgres` yang **mem-bypass RLS**, sehingga isolasi per-user dijamin oleh kode (`where: { userId }`), bukan oleh policy. RLS tetap diaktifkan tanpa policy (default deny) supaya tabel tidak bisa dibaca lewat `anon key` yang bersifat publik, termasuk tabel `budgets`. Jangan menambahkan policy `USING (true)` pada tabel mana pun.

## Cara kerja modul Budget
- **Bulan sebagai bagian URL**: `/budgets` selalu redirect ke `/budgets/<bulan-sekarang>` (format `YYYY-MM`), dan tombol Sebelumnya/Berikutnya mengganti bulan di URL (`lib/format.ts#shiftPeriod`). Ini membuat halaman bisa di-refresh atau di-bookmark tanpa kehilangan posisi bulan (UC-BUD-04).
- **Pengeluaran dihitung dari `transactions`, bukan kolom baru**: `lib/budget.ts#getBudgetSummary` mencocokkan `transactions.category` + `to_char(date, 'YYYY-MM')` terhadap `budgets.category` + `budgets.period` lewat satu query agregat (`$queryRaw` dengan parameter ter-parameterisasi, aman dari SQL injection). Dengan begitu transaksi pengeluaran yang sudah ada sebelum modul ini dibuat otomatis ikut terhitung (FR-EXP-03/07), tanpa perlu migrasi data atau relasi `budgetId` di `Transaction`.
- **Indikator** (`lib/budget.ts#budgetStatus`): aman (<70%), waspada (70–99%), overspending (≥100%), sesuai tabel di SRS bagian 2.3.
- Halaman detail budget (`/budgets/[period]/[category]`) menghitung ulang total pengeluaran dan status langsung dari transaksi pada rentang bulan itu (bukan dari nilai cache), sehingga selalu konsisten dengan daftar di `/budgets/[period]`.

## Catatan & keterbatasan
- Next.js 16+ memakai `proxy.ts` di root proyek (sejajar dengan folder `app`). Jika versi Anda lebih lama, ganti nama file menjadi `middleware.ts` dan fungsi `proxy` menjadi `middleware`.
- Rate limit in-memory tidak dibagi antar instance serverless; untuk production pakai Redis/Upstash.
- Daftar transaksi dibatasi 200 item terbaru (belum ada pagination).
- Menghapus budget tidak ikut menghapus transaksi pengeluaran terkait (sesuai SRS UC-BUD-06 langkah 3) — transaksinya tetap ada, hanya tidak lagi terhubung ke budget mana pun.
- Kategori pada budget dan pada transaksi dicocokkan sebagai teks biasa (case-sensitive, tanpa tabel kategori terpisah), sesuai cara kategori transaksi sudah bekerja di modul dasar.
- Fitur di luar SRS: lupa password, upload bukti, multi-currency.

## Koordinasi jika ada anggota lain yang menyentuh repo yang sama
- **`prisma/schema.prisma` dan folder `migrations/`**: satu sumber kebenaran. Jangan ada dua orang membuat migrasi bersamaan; urutkan lewat pull request dan gunakan nama folder migrasi dengan timestamp. Migrasi `…_add_budgets` di paket ini **hanya menambah** tabel baru — tidak mengubah tabel `users`/`sessions`/`transactions` yang sudah ada, jadi aman digabung ke migrasi anggota lain selama mereka juga tidak menyentuh tabel yang sama.
- **Tabel `users`**: kunci relasi untuk data anggota lain (`user_id` UUID, `ON DELETE CASCADE`). Fitur baru sebaiknya menambah relasi ke `User`, bukan mengubah kolomnya. Modul budget menambah relasi `User.budgets` — kalau anggota lain juga menambah relasi baru ke `User` di waktu yang sama, akan ada konflik merge di blok model `User`; selesaikan dengan menggabungkan kedua baris relasi, bukan memilih salah satu.
- **Kategori transaksi (`transactions.category`)**: modul budget mencocokkan budget ke transaksi lewat kolom `category` ini (teks bebas, case-sensitive). Kalau anggota lain mengubah `category` menjadi tabel/enum terpisah, sesuaikan juga query di `lib/budget.ts` dan halaman `/budgets/[period]/[category]`.
- **`lib/session.ts` dan `requireUser()`**: satu-satunya cara mengetahui user yang login. Fitur lain cukup memanggil `requireUser()`.
- **Aturan RLS**: setiap tabel baru harus `ENABLE ROW LEVEL SECURITY` dan selalu difilter `userId` di query Prisma. Tabel `budgets` sudah mengikuti pola ini.
- **`proxy.ts` matcher**: jika ada halaman terproteksi baru, tambahkan path-nya di `PROTECTED` dan `matcher`. Path `/budgets` sudah ditambahkan di paket ini.
- **`components/NavLinks.tsx`**: link navbar disimpan sebagai satu array; kalau anggota lain juga menambah menu baru di waktu yang sama, akan ada konflik merge kecil di array ini — gabungkan urutan link, jangan saling menimpa.
- **`components/DeleteButton.tsx`**: diberi prop `confirmMessage` opsional (default tetap sama seperti sebelumnya) supaya bisa dipakai ulang untuk konfirmasi hapus budget. Kalau anggota lain juga mengubah komponen ini, pastikan perubahan mereka tidak menghapus prop ini.
- **`globals.css`, `layout.tsx`, `next.config.ts`**: file bersama yang mudah konflik saat merge.
- **Versi dependensi**: `prisma@6` dan `@prisma/client@6` harus sama di seluruh tim. Modul budget tidak menambah dependensi baru.
- **`.env`**: tiap anggota membuat sendiri; bagikan connection string Supabase lewat jalur aman, jangan lewat commit.

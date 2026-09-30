# Expense Tracker — Aplikasi Manajemen Keuangan Pribadi

Next.js (App Router) + TypeScript + Tailwind + Prisma 6 + Supabase PostgreSQL.
Auth, session, dan cookie preferensi dibuat sendiri (tanpa Supabase Auth) sesuai SRS v2.0.

## Fitur
- Register / login / logout, session persisten 7 hari (tersimpan di tabel `sessions`)
- Proteksi `/dashboard`, `/transactions`, `/settings`
- Cookie preferensi `theme` (light/dark) dan `transactionView` (list/grid), berlaku 1 tahun
- Dashboard: total pemasukan, total pengeluaran, saldo, 5 transaksi terbaru
- Tambah, lihat, filter (semua/pemasukan/pengeluaran), hapus transaksi
- Data transaksi terisolasi per user

## Struktur file
```
prisma/
  schema.prisma                      skema tabel (users, sessions, transactions)
  migrations/…_init                  SQL pembuatan tabel
  migrations/…_hardening_rls         CHECK amount > 0, RLS
  seed.ts                            akun demo
proxy.ts                             penjaga route (lapis 1, cek cookie)
lib/                                 prisma, session, auth (requireUser), prefs, validation, rate-limit, format
app/actions/                         Server Actions: auth, transactions, preferences
app/(auth)/login, register           halaman guest
app/(app)/dashboard, transactions, settings   halaman terproteksi
components/                          form, daftar transaksi, navbar
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
`db:migrate` menjalankan dua SQL di `prisma/migrations/`. Jika ingin menjalankan manual, tempel isinya berurutan di Supabase → SQL Editor.

### 8. Jalankan aplikasi
```bash
pnpm dev
```
Buka http://localhost:3000.

## Info login

| Actor | Cara akses | Email | Password |
|---|---|---|---|
| Guest | Tanpa login; hanya `/login` dan `/register` | – | – |
| User (demo) | Dibuat oleh `pnpm db:seed`, berisi 5 transaksi contoh | `demo@example.com` | `Demo12345!` |
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
- Otorisasi: `userId` selalu diambil dari session, bukan dari form; hapus memakai `deleteMany({ where: { id, userId } })` sehingga transaksi milik user lain tidak bisa dihapus
- Database: `CHECK (amount > 0)`, foreign key `ON DELETE CASCADE`, email `UNIQUE`

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
Aplikasi ini tidak memakai Supabase Auth dan tidak memakai Supabase Data API. Prisma tersambung sebagai role `postgres` yang **mem-bypass RLS**, sehingga isolasi per-user dijamin oleh kode (`where: { userId }`), bukan oleh policy. RLS tetap diaktifkan tanpa policy (default deny) supaya tabel tidak bisa dibaca lewat `anon key` yang bersifat publik. Jangan menambahkan policy `USING (true)` pada tabel ini.

## Catatan & keterbatasan
- Next.js 16+ memakai `proxy.ts` di root proyek (sejajar dengan folder `app`). Jika versi Anda lebih lama, ganti nama file menjadi `middleware.ts` dan fungsi `proxy` menjadi `middleware`.
- Rate limit in-memory tidak dibagi antar instance serverless; untuk production pakai Redis/Upstash.
- Daftar transaksi dibatasi 200 item terbaru (belum ada pagination).
- Fitur di luar SRS: lupa password, upload bukti, multi-currency.

## Koordinasi jika ada anggota lain yang menyentuh repo yang sama
- **`prisma/schema.prisma` dan folder `migrations/`**: satu sumber kebenaran. Jangan ada dua orang membuat migrasi bersamaan; urutkan lewat pull request dan gunakan nama folder migrasi dengan timestamp.
- **Tabel `users`**: kunci relasi untuk data anggota lain (`user_id` UUID, `ON DELETE CASCADE`). Fitur baru sebaiknya menambah relasi ke `User`, bukan mengubah kolomnya.
- **`lib/session.ts` dan `requireUser()`**: satu-satunya cara mengetahui user yang login. Fitur lain cukup memanggil `requireUser()`.
- **Aturan RLS**: setiap tabel baru harus `ENABLE ROW LEVEL SECURITY` dan selalu difilter `userId` di query Prisma.
- **`proxy.ts` matcher**: jika ada halaman terproteksi baru, tambahkan path-nya di `PROTECTED` dan `matcher`.
- **`globals.css`, `layout.tsx`, `next.config.ts`**: file bersama yang mudah konflik saat merge.
- **Versi dependensi**: `prisma@6` dan `@prisma/client@6` harus sama di seluruh tim.
- **`.env`**: tiap anggota membuat sendiri; bagikan connection string Supabase lewat jalur aman, jangan lewat commit.

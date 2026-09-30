-- Constraint yang tidak bisa dimodelkan Prisma: nominal harus positif
ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_amount_positive" CHECK ("amount" > 0);

-- ROW LEVEL SECURITY
-- Aplikasi ini TIDAK memakai Supabase Auth dan TIDAK memakai Data API (PostgREST).
-- Prisma terhubung sebagai role `postgres` yang mem-bypass RLS, jadi isolasi data
-- per user dijamin di kode aplikasi (setiap query memakai `userId` dari session).
-- RLS di bawah ini adalah pagar kedua: mengunci akses lewat anon/authenticated key
-- (Data API) supaya tabel tidak bisa dibaca siapa pun yang memegang anon key.
-- Sengaja TANPA policy = semua akses via anon/authenticated ditolak (default deny).
ALTER TABLE "users"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Cabut hak langsung dari role Data API (aman dijalankan meski role tidak dipakai)
REVOKE ALL ON TABLE "users", "sessions", "transactions", "_prisma_migrations" FROM anon, authenticated;

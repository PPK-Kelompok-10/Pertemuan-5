-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "period" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- FR-BUD-01 / UC-BUD-01: tidak boleh duplikat kategori + bulan untuk user yang sama
CREATE UNIQUE INDEX "budgets_user_id_category_period_key" ON "budgets"("user_id", "category", "period");

-- UC-BUD-04: query "budget bulan ini" per user
CREATE INDEX "budgets_user_id_period_idx" ON "budgets"("user_id", "period");

-- nominal harus > 0 (SRS 2.1 langkah 4)
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_amount_positive" CHECK ("amount" > 0);

-- format period harus YYYY-MM
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_period_format" CHECK ("period" ~ '^\d{4}-\d{2}$');

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: tabel baru mengikuti pola tabel lain di project ini (lihat migrasi hardening_rls) —
-- Prisma tersambung sebagai role `postgres` yang mem-bypass RLS, jadi isolasi per-user tetap
-- dijamin di kode aplikasi (`where: { userId }`). RLS di sini hanya mengunci akses lewat
-- anon/authenticated key (Supabase Data API), yang tidak dipakai project ini.
ALTER TABLE "budgets" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "budgets" FROM anon, authenticated;

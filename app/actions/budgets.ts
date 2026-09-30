"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { budgetSchema, budgetUpdateSchema } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");
// Sama seperti app/actions/auth.ts: cek kode error Prisma tanpa import class dari @prisma/client
const isDuplicateBudget = (e: unknown) =>
  typeof e === "object" && e !== null && "code" in e && e.code === "P2002";

function refresh(period?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  if (period) revalidatePath(`/budgets/${period}`);
}

// UC-BUD-01 / FR-BUD-01
export async function createBudgetAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(); // userId SELALU dari session — FR-ISO-01

  const raw = { category: str(fd, "category"), amount: str(fd, "amount"), period: str(fd, "period") };
  const parsed = budgetSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: raw };

  const { category, amount, period } = parsed.data;
  try {
    await prisma.budget.create({ data: { userId: user.id, category, amount, period } });
  } catch (e) {
    if (isDuplicateBudget(e)) {
      return { errors: { category: ["Budget untuk kategori ini di bulan tersebut sudah ada"] }, values: raw };
    }
    throw e;
  }

  refresh(period);
  return { ok: true, message: "Budget berhasil disimpan" };
}

// UC-BUD-05 / FR-BUD-03: hanya nominal yang bisa diubah; kategori & bulan tetap.
export async function updateBudgetAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();

  const id = str(fd, "id");
  const period = str(fd, "period"); // dipakai untuk redirect/refresh, bukan untuk where
  const raw = { amount: str(fd, "amount") };

  if (!z.string().uuid().safeParse(id).success) return { message: "Budget tidak ditemukan" };

  const parsed = budgetUpdateSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: raw };

  // `where: { id, userId }` — FR-ISO-04: user tidak bisa mengubah budget user lain meski menebak id
  const result = await prisma.budget.updateMany({
    where: { id, userId: user.id },
    data: { amount: parsed.data.amount },
  });
  if (result.count === 0) return { message: "Budget tidak ditemukan" };

  refresh(period);
  return { ok: true, message: "Budget berhasil diperbarui" };
}

// UC-BUD-06 / FR-BUD-04
export async function deleteBudgetAction(id: string, period: string): Promise<void> {
  const user = await requireUser();
  if (!z.string().uuid().safeParse(id).success) return;

  // FR-ISO-04: `userId` di where = tidak bisa menghapus budget milik user lain.
  // Transaksi terkait sengaja TIDAK ikut terhapus (UC-BUD-06 langkah 3).
  await prisma.budget.deleteMany({ where: { id, userId: user.id } });
  refresh(period);
}

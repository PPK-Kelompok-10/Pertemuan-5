"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { transactionSchema } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function createTransactionAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(); // userId SELALU dari session, tidak pernah dari form

  const raw = {
    type: str(fd, "type"),
    amount: str(fd, "amount"),
    category: str(fd, "category"),
    description: str(fd, "description"),
    date: str(fd, "date"),
  };
  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: raw };

  const { type, amount, category, description, date } = parsed.data;
  await prisma.transaction.create({
    data: {
      userId: user.id,
      type,
      amount,
      category,
      description: description || null,
      date: new Date(`${date}T00:00:00.000Z`),
    },
  });

  refresh();
  return { ok: true, message: "Transaksi berhasil disimpan" };
}

export async function deleteTransactionAction(id: string): Promise<void> {
  const user = await requireUser();
  if (!z.string().uuid().safeParse(id).success) return;

  // `userId` di where = user tidak bisa menghapus transaksi milik orang lain meski menebak id
  await prisma.transaction.deleteMany({ where: { id, userId: user.id } });
  refresh();
}

"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validation";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import type { FormState } from "@/lib/form-state";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

// Hash tiruan agar waktu respons login tidak membocorkan apakah email terdaftar
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

export async function registerAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = {
    nama: str(fd, "nama"),
    email: str(fd, "email"),
    password: str(fd, "password"),
    konfirmasiPassword: str(fd, "konfirmasiPassword"),
  };
  const values = { nama: raw.nama, email: raw.email }; // password tidak pernah dikembalikan ke client

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values };

  const { nama, email, password } = parsed.data;
  const emailTaken = { errors: { email: ["Email sudah terdaftar"] }, values };

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return emailTaken;

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await prisma.user.create({ data: { nama, email, passwordHash } });
  } catch (e) {
    // dua request bersamaan dengan email yang sama -> unique constraint
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") return emailTaken;
    throw e;
  }
  redirect("/login?registered=1");
}

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = { email: str(fd, "email"), password: str(fd, "password") };
  const values = { email: raw.email };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values };

  const { email, password } = parsed.data;
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rlKey = `login:${ip}:${email}`;

  const rl = rateLimit(rlKey);
  if (!rl.ok) {
    return { message: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(rl.retryAfterSec / 60)} menit.`, values };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { message: "Email atau password salah", values };

  resetRateLimit(rlKey);
  await createSession(user.id); // token baru setiap login
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 7; // FR-SESS-03

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** Buat session baru di DB + set cookie (HttpOnly, SameSite=Lax, Secure di production). Panggil hanya dari Server Action / Route Handler. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { id: sha256(token), userId, expiresAt } });
  // bersihkan session kedaluwarsa secara oportunistik
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Ambil user dari session yang valid; null jika guest / session tidak ada / kedaluwarsa. Read-only. */
export const getSessionUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: sha256(token) },
    select: { expiresAt: true, user: { select: { id: true, nama: true, email: true } } },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.user;
});

/** FR-AUTH-09: hapus session dari DB dan hapus cookie. */
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

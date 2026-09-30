/**
 * Seed akun demo (tidak ada role admin di SRS, jadi hanya 1 user demo untuk testing).
 * Jalankan: pnpm db:seed   — aman dijalankan berulang kali (idempotent).
 * JANGAN dijalankan di database production yang dipakai umum.
 */
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma"; // singleton yang sama dengan aplikasi

const DEMO = {
  nama: "Pengguna Demo",
  email: "demo@example.com",
  password: "Demo12345!",
};

const day = (offset: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offset);
  return d;
};

async function main() {
  const passwordHash = await bcrypt.hash(DEMO.password, 12);
  const user = await prisma.user.upsert({
    where: { email: DEMO.email },
    update: { nama: DEMO.nama, passwordHash },
    create: { nama: DEMO.nama, email: DEMO.email, passwordHash },
  });

  const count = await prisma.transaction.count({ where: { userId: user.id } });
  if (count === 0) {
    await prisma.transaction.createMany({
      data: [
        { userId: user.id, type: "income", amount: 3500000, category: "Uang saku", description: "Kiriman bulanan", date: day(12) },
        { userId: user.id, type: "income", amount: 450000, category: "Freelance", description: "Desain poster", date: day(6) },
        { userId: user.id, type: "expense", amount: 850000, category: "Kos", description: "Cicilan kos", date: day(10) },
        { userId: user.id, type: "expense", amount: 32000, category: "Makan", description: "Makan siang", date: day(3) },
        { userId: user.id, type: "expense", amount: 120000, category: "Transport", description: "Bensin", date: day(1) },
      ],
    });
  }
  console.log(`Seed selesai. Login: ${DEMO.email} / ${DEMO.password}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

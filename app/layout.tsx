import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getPrefs } from "@/lib/prefs";
import "./globals.css";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Expense Tracker", template: "%s · Expense Tracker" },
  description: "Catat pemasukan dan pengeluaran pribadi.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme } = await getPrefs(); // tema dari cookie -> tidak ada kilatan tema saat refresh
  return (
    <html lang="id" className={`${font.variable} ${theme === "dark" ? "dark" : ""}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

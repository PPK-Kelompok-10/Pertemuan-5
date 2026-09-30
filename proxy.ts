// Next.js 16+: file ini bernama `proxy.ts` (di root proyek, sejajar folder `app`) dan fungsi `proxy`.
// Jika versi Next.js Anda < 16: ganti nama file menjadi `middleware.ts` dan nama fungsi menjadi `middleware`.
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/transactions", "/settings"];

/**
 * Lapis pertama (optimistis, cepat): tolak guest yang bahkan tidak punya cookie session.
 * Validasi sebenarnya (session ada di DB & belum kedaluwarsa) dilakukan di `requireUser()`
 * pada layout/action — jangan menganggap proxy saja sudah cukup.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !req.cookies.has("sid")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/transactions/:path*", "/settings/:path*"],
};

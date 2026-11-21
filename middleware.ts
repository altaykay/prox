import { NextResponse, type NextRequest } from "next/server";
import { AGE_COOKIE, readSession, SESSION_COOKIE } from "./lib/session";

// Pages accessibles sans confirmation d'âge : entrée, aide/sécurité et pages légales.
const OPEN = ["/entree", "/aide", "/cgu", "/confidentialite", "/mentions-legales", "/signaler"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const s = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!s) return NextResponse.redirect(new URL("/admin/login", req.url));
    return NextResponse.next();
  }

  if (OPEN.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  if (req.cookies.get(AGE_COOKIE)?.value !== "1") {
    const url = new URL("/entree", req.url);
    url.searchParams.set("suite", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/|api/|uploads/|favicon|robots.txt).*)"] };

// Jetons de session signés (sans dépendance Node) : utilisables dans le middleware.
// Deux sessions distinctes : équipe (prox_admin) et annonceuse (prox_pro).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "prox_admin";
export const PRO_COOKIE = "prox_pro";
export const AGE_COOKIE = "prox_18";
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "");

export type SessionPayload = { sub: string; role: "ADMIN" | "MODERATOR"; name: string };

async function sign(p: Record<string, unknown>, aud: string, exp: string) {
  return new SignJWT(p).setProtectedHeader({ alg: "HS256" }).setAudience(aud).setIssuedAt().setExpirationTime(exp).sign(key());
}
async function verify(token: string | undefined, aud: string) {
  if (!token) return null;
  try {
    return (await jwtVerify(token, key(), { audience: aud })).payload;
  } catch {
    return null;
  }
}

export const signSession = (p: SessionPayload) => sign(p, "admin", "8h");
export const readSession = async (t?: string) => (await verify(t, "admin")) as unknown as SessionPayload | null;

export const signPro = (accountId: string) => sign({ sub: accountId }, "pro", "30d");
export const readPro = async (t?: string) => ((await verify(t, "pro"))?.sub as string | undefined) ?? null;

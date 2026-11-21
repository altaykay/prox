import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

// Le visiteur n'a pas de compte : ses conversations sont retrouvées par un jeton secret,
// gardé dans un cookie de son navigateur et dans le lien privé /messages/<jeton>.
export const MSG_COOKIE = "prox_msg";
export const MSG_MAX = 2000;
export const NAME_MAX = 40;
export const MAX_IN_A_ROW = 5; // messages consécutifs du visiteur sans réponse

export const newToken = () => randomBytes(18).toString("base64url");
export const validToken = (t: string) => /^[A-Za-z0-9_-]{10,64}$/.test(t);

export async function myTokens(): Promise<string[]> {
  const raw = (await cookies()).get(MSG_COOKIE)?.value ?? "";
  return raw.split(".").filter(validToken).slice(0, 30);
}

export async function rememberToken(token: string) {
  const list = [token, ...(await myTokens()).filter((t) => t !== token)].slice(0, 30);
  (await cookies()).set(MSG_COOKIE, list.join("."), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 365 * 86400,
  });
}

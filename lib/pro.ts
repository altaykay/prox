import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { PRO_COOKIE, readPro } from "./session";

export async function currentAccountId() {
  return readPro((await cookies()).get(PRO_COOKIE)?.value);
}

export async function requirePro() {
  const id = await currentAccountId();
  const acc = id ? await db.account.findUnique({ where: { id } }) : null;
  if (!acc) redirect("/espace/connexion");
  return acc;
}

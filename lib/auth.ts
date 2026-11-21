import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession, SESSION_COOKIE } from "./session";

export async function requireAdmin(opts?: { role?: "ADMIN" }) {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) redirect("/admin/login");
  if (opts?.role === "ADMIN" && s.role !== "ADMIN") redirect("/admin?erreur=droits");
  return s;
}

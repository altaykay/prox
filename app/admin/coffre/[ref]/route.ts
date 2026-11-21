// Consultation d'un document d'identité par l'équipe : authentifiée, jamais mise en cache, journalisée.
import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE } from "@/lib/session";
import { readDocument } from "@/lib/vault";
import { logAction } from "@/lib/log";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ ref: string }> }) {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return new Response("Non autorisé", { status: 401 });
  const { ref } = await params;
  const v = await db.identityVerification.findFirst({ where: { OR: [{ idDocumentRef: ref }, { selfieRef: ref }] } });
  if (!v) return new Response("Introuvable", { status: 404 });
  const doc = await readDocument(ref);
  await logAction(s.sub, "Document d'identité consulté", "account", v.accountId, ref === v.selfieRef ? "selfie" : "pièce d'identité");
  return new Response(new Uint8Array(doc.data), {
    headers: { "Content-Type": doc.type, "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "Content-Disposition": "inline" },
  });
}

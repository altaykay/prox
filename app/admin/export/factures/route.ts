import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE } from "@/lib/session";
import { db } from "@/lib/db";
import { invoiceTotal } from "@/lib/format";

export async function GET(req: Request) {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return new Response("Non autorisé", { status: 401 });
  const year = Number(new URL(req.url).searchParams.get("annee")) || new Date().getFullYear();
  const rows = await db.invoice.findMany({
    where: { issueDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } }, orderBy: { number: "asc" },
  });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const d = (x?: Date | null) => (x ? x.toISOString().slice(0, 10) : "");
  const lines = [
    ["numero", "date", "echeance", "client", "objet", "montant_ht", "tva_pct", "total", "statut", "paye_le", "moyen"].join(";"),
    ...rows.map((i) => [i.number, d(i.issueDate), d(i.dueDate), i.billingName, i.label, (i.amountCents / 100).toFixed(2),
      (i.vatRateBp / 100).toFixed(1), (invoiceTotal(i.amountCents, i.vatRateBp) / 100).toFixed(2), i.status, d(i.paidAt), i.paymentMethod ?? ""].map(esc).join(";")),
  ];
  return new Response("﻿" + lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="factures-${year}.csv"` },
  });
}

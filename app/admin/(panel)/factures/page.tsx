import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { INVOICE_STATUS } from "@/lib/constants";
import { chf, date, invoiceTotal } from "@/lib/format";
import { Badge, Empty, Filters } from "@/components/ui";

export default async function Invoices({ searchParams }: { searchParams: Promise<{ statut?: string; annee?: string }> }) {
  const sp = await searchParams;
  const now = new Date();
  const where: Prisma.InvoiceWhereInput = {};
  if (sp.statut === "OVERDUE") Object.assign(where, { status: "SENT", dueDate: { lt: now } });
  else if (sp.statut) where.status = sp.statut as Prisma.InvoiceWhereInput["status"];
  const year = Number(sp.annee) || now.getFullYear();
  where.issueDate = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
  const invoices = await db.invoice.findMany({ where, orderBy: { issueDate: "desc" }, include: { account: { include: { listing: true } } } });
  const sum = (st: string) => invoices.filter((i) => i.status === st).reduce((t, i) => t + invoiceTotal(i.amountCents, i.vatRateBp), 0);
  const overdue = invoices.filter((i) => i.status === "SENT" && i.dueDate < now);
  return (
    <>
      <div className="page-head">
        <h1>Factures {year}</h1>
        <div className="actions">
          <Link className="btn" href={`/admin/export/factures?annee=${year}`}>Exporter (CSV)</Link>
          <Link className="btn primary" href="/admin/factures/nouvelle">+ Nouvelle facture</Link>
        </div>
      </div>
      <div className="grid kpis" style={{ marginBottom: 16 }}>
        <div className="kpi"><div className="label">Encaissé</div><div className="value">{chf(sum("PAID"))}</div></div>
        <div className="kpi"><div className="label">En attente</div><div className="value">{chf(sum("SENT"))}</div></div>
        <div className="kpi"><div className="label">En retard</div><div className="value">{overdue.length}</div></div>
        <div className="kpi"><div className="label">Factures</div><div className="value">{invoices.length}</div></div>
      </div>
      <Filters base="/admin/factures" current={sp.statut} options={{ SENT: "Envoyées", OVERDUE: "En retard", PAID: "Payées", DRAFT: "Brouillons", CANCELLED: "Annulées" }} />
      <div className="filters" style={{ marginTop: -6 }}>
        {[year - 1, year, year + 1].map((y) => <Link key={y} href={`/admin/factures?annee=${y}${sp.statut ? `&statut=${sp.statut}` : ""}`} className={y === year ? "on" : ""}>{y}</Link>)}
      </div>
      <div className="table-wrap">
        {invoices.length === 0 ? <Empty>Aucune facture.</Empty> : (
          <table>
            <thead><tr><th>N°</th><th>Client</th><th>Objet</th><th className="num">Total</th><th>Échéance</th><th>Statut</th></tr></thead>
            <tbody>{invoices.map((i) => {
              const late = i.status === "SENT" && i.dueDate < now;
              return (
                <tr key={i.id}>
                  <td><Link href={`/admin/factures/${i.id}`}>{i.number}</Link><br /><span className="muted small">{date(i.issueDate)}</span></td>
                  <td>{i.account?.listing?.pseudo ?? i.billingName}</td>
                  <td className="small">{i.label}</td>
                  <td className="num">{chf(invoiceTotal(i.amountCents, i.vatRateBp))}</td>
                  <td className="small">{date(i.dueDate)}</td>
                  <td><Badge value={late ? "OVERDUE" : i.status} labels={INVOICE_STATUS} />{i.paidAt && <div className="muted small">{date(i.paidAt)}</div>}</td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>
    </>
  );
}

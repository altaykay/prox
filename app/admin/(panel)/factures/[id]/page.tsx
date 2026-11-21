import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { INVOICE_STATUS } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { chf, date, dayKey, invoiceTotal } from "@/lib/format";
import { Badge, Notice } from "@/components/ui";
import { setInvoiceStatus } from "../../../actions";
import { PrintButton } from "@/components/PrintButton";

export default async function InvoiceDetail({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const site = await getSettings();
  const i = await db.invoice.findUnique({ where: { id }, include: { subscription: true } });
  if (!i) notFound();
  const vat = invoiceTotal(i.amountCents, i.vatRateBp) - i.amountCents;
  const late = i.status === "SENT" && i.dueDate < new Date();
  return (
    <>
      <div className="page-head no-print">
        <h1>Facture {i.number} <Badge value={late ? "OVERDUE" : i.status} labels={INVOICE_STATUS} /></h1>
        <div className="actions">
          <PrintButton />
          {i.subscriptionId && <Link className="btn" href={`/admin/abonnements/${i.subscriptionId}`}>Abonnement</Link>}
          {i.accountId && <Link className="btn" href={`/admin/comptes/${i.accountId}`}>Compte</Link>}
        </div>
      </div>
      <div className="no-print"><Notice sp={sp} /></div>

      {i.status !== "PAID" && i.status !== "CANCELLED" && (
        <section className="card no-print">
          <h2>Enregistrer le paiement</h2>
          <form action={setInvoiceStatus} className="fields cols-3">
            <input type="hidden" name="id" value={i.id} /><input type="hidden" name="status" value="PAID" />
            <label>Date de paiement<input type="date" name="paidAt" defaultValue={dayKey()} /></label>
            <label>Moyen
              <select name="paymentMethod"><option>Virement bancaire</option><option>TWINT</option><option>Espèces</option><option>Autre</option></select>
            </label>
            <div style={{ alignSelf: "end" }}><button className="btn primary">Marquer payée</button></div>
          </form>
          <div className="actions" style={{ marginTop: 12 }}>
            {i.status === "DRAFT" && <StatusForm id={i.id} status="SENT" label="Marquer envoyée" />}
            <StatusForm id={i.id} status="CANCELLED" label="Annuler la facture" danger />
          </div>
        </section>
      )}
      {i.status === "PAID" && (
        <div className="notice no-print">Payée le {date(i.paidAt)} · {i.paymentMethod ?? "—"} <StatusForm id={i.id} status="SENT" label="Annuler le paiement" small /></div>
      )}

      <article className="invoice-doc">
        <div className="head">
          <div><h2 style={{ fontSize: "1.6rem" }}>{site.siteName}</h2><div className="small" style={{ whiteSpace: "pre-line" }}>{site.issuerName || "Raison sociale à compléter (Paramètres)"}{"\n"}{site.issuerAddress}{site.issuerIde && `\nIDE ${site.issuerIde}`}{site.issuerVat && `\nTVA ${site.issuerVat}`}{site.siteDomain && `\n${site.siteDomain}`}</div></div>
          <div className="small" style={{ whiteSpace: "pre-line" }}><strong>{i.billingName}</strong>{"\n"}{i.billingAddress}</div>
        </div>
        <h2>Facture {i.number}</h2>
        <dl className="meta" style={{ marginBottom: 20 }}>
          <dt>Date</dt><dd>{date(i.issueDate)}</dd><dt>Échéance</dt><dd>{date(i.dueDate)}</dd>
        </dl>
        <table>
          <thead><tr><th>Désignation</th><th className="num">Montant</th></tr></thead>
          <tbody>
            <tr><td>{i.label}</td><td className="num">{chf(i.amountCents)}</td></tr>
            {i.vatRateBp > 0 && <tr><td>TVA {(i.vatRateBp / 100).toFixed(1)} %</td><td className="num">{chf(vat)}</td></tr>}
            <tr><td><strong>Total</strong></td><td className="num"><strong>{chf(i.amountCents + vat)}</strong></td></tr>
          </tbody>
        </table>
        {i.notes && <p className="small" style={{ marginTop: 16 }}>{i.notes}</p>}
        <p className="small" style={{ marginTop: 24 }}>Paiement par virement sur l'IBAN {site.issuerIban || "(à compléter dans Paramètres)"}, en indiquant la référence {i.number}.</p>
        <p className="small muted">Libellé neutre sur les relevés : « {site.siteName} – services en ligne ».</p>
      </article>
    </>
  );
}

function StatusForm({ id, status, label, danger, small }: { id: string; status: string; label: string; danger?: boolean; small?: boolean }) {
  return (
    <form action={setInvoiceStatus} style={{ display: "inline" }}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} />
      <button className={`btn${danger ? " danger" : ""}${small ? " small" : ""}`}>{label}</button>
    </form>
  );
}

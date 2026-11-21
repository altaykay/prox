import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { INVOICE_STATUS, PLAN_TYPE, SHOOT_STATUS, SUB_STATUS } from "@/lib/constants";
import { chf, date, dayKey } from "@/lib/format";
import { Badge, Notice } from "@/components/ui";
import { renewSubscription, updateSubscription } from "../../../actions";

export default async function SubscriptionDetail({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const s = await db.subscription.findUnique({
    where: { id }, include: { plan: true, createdBy: true, invoices: true, account: { include: { listing: true } } },
  });
  if (!s) notFound();
  return (
    <>
      <div className="page-head">
        <h1>{s.label} <Badge value={s.status} labels={SUB_STATUS} /></h1>
        <form action={renewSubscription}><input type="hidden" name="id" value={s.id} /><button className="btn">Renouveler</button></form>
      </div>
      <Notice sp={sp} />
      <div className="grid two">
        <section className="card">
          <dl className="meta">
            <dt>Annonceuse</dt><dd><Link href={`/admin/comptes/${s.accountId}`}>{s.account.listing?.pseudo ?? s.account.email}</Link></dd>
            <dt>Formule</dt><dd>{s.plan.name} · {PLAN_TYPE[s.plan.type]}</dd>
            <dt>Prix</dt><dd>{s.priceCents ? chf(s.priceCents) : "Offert"}</dd>
            <dt>Période</dt><dd>{date(s.startDate)} → {date(s.endDate)}</dd>
            <dt>Créé par</dt><dd>{s.createdBy?.name ?? "—"}</dd>
          </dl>
          <h3 style={{ marginTop: 16 }}>Factures</h3>
          <table><tbody>{s.invoices.map((i) => (
            <tr key={i.id}><td><Link href={`/admin/factures/${i.id}`}>{i.number}</Link></td><td className="num">{chf(i.amountCents)}</td><td><Badge value={i.status} labels={INVOICE_STATUS} /></td></tr>
          ))}</tbody></table>
          <Link className="btn small" style={{ marginTop: 8 }} href={`/admin/factures/nouvelle?compte=${s.accountId}&abonnement=${s.id}`}>+ Facture</Link>
        </section>
        <section className="card">
          <form action={updateSubscription} className="stack">
            <input type="hidden" name="id" value={s.id} />
            <label>Statut
              <select name="status" defaultValue={s.status}>{Object.entries(SUB_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </label>
            <label>Fin<input type="date" name="endDate" defaultValue={dayKey(s.endDate)} /></label>
            {(s.plan.includesPhotoShoot || s.photoShootStatus !== "NONE") && (
              <div className="fields cols-2">
                <label>Séance photo
                  <select name="photoShootStatus" defaultValue={s.photoShootStatus}>{Object.entries(SHOOT_STATUS).map(([k, v]) => <option key={k} value={k}>{v === "—" ? "Aucune" : v}</option>)}</select>
                </label>
                <label>Date de la séance<input type="date" name="photoShootDate" defaultValue={s.photoShootDate ? dayKey(s.photoShootDate) : ""} /></label>
              </div>
            )}
            <label>Notes<textarea name="notes" defaultValue={s.notes ?? ""} /></label>
            <div className="actions"><button className="btn primary">Enregistrer</button></div>
          </form>
          {s.photoShootStatus === "DONE" && s.account.listing && (
            <p className="small muted" style={{ marginTop: 10 }}>Ajoutez les photos de la séance sur <Link href={`/admin/annonces/${s.account.listing.id}`}>l'annonce</Link> (source « Séance photo de l'équipe »).</p>
          )}
          {s.photoShootStatus !== "NONE" && <p className="small muted">Statut séance : <Badge value={s.photoShootStatus} labels={SHOOT_STATUS} /></p>}
        </section>
      </div>
    </>
  );
}

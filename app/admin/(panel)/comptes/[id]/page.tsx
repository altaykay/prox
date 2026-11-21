import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ACCOUNT_STATUS, CANTONS_WITH_REGISTRATION, INVOICE_STATUS, LISTING_STATUS, SUB_STATUS, VERIFICATION_STATUS } from "@/lib/constants";
import { chf, date, dateTime } from "@/lib/format";
import { Badge, Notice } from "@/components/ui";
import { AccountFields } from "@/components/AccountFields";
import { deleteAccount, reviewVerification, saveAccount, setAccountStatus } from "../../../actions";

export default async function AccountDetail({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const a = await db.account.findUnique({
    where: { id },
    include: {
      listing: true, verification: { include: { reviewedBy: true } },
      subscriptions: { orderBy: { createdAt: "desc" } }, invoices: { orderBy: { issueDate: "desc" } },
    },
  });
  if (!a) notFound();
  const v = a.verification;
  const cantonNeedsReg = a.listing ? CANTONS_WITH_REGISTRATION.includes(a.listing.canton) : false;

  return (
    <>
      <div className="page-head">
        <h1>{a.listing?.pseudo ?? a.email} <Badge value={a.status} labels={ACCOUNT_STATUS} /></h1>
        <div className="actions">
          <form action={setAccountStatus}>
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="status" value={a.status === "SUSPENDED" ? (v?.status === "APPROVED" ? "VERIFIED" : "PENDING_VERIFICATION") : "SUSPENDED"} />
            <button className={a.status === "SUSPENDED" ? "btn" : "btn danger"}>{a.status === "SUSPENDED" ? "Réactiver le compte" : "Suspendre le compte"}</button>
          </form>
        </div>
      </div>
      <Notice sp={sp} />

      <section className="card">
        <h2>Vérification d'identité et d'âge <Badge value={v?.status ?? "PENDING"} labels={VERIFICATION_STATUS} /></h2>
        <p className="muted small">Documents conservés chiffrés dans un coffre séparé. Chaque consultation est inscrite au journal.</p>
        <div className="actions" style={{ marginBottom: 12 }}>
          {v?.idDocumentRef ? <a className="btn" href={`/admin/coffre/${v.idDocumentRef}`} target="_blank" rel="noreferrer">Voir la pièce d'identité</a> : <span className="muted">Pièce d'identité non fournie</span>}
          {v?.selfieRef ? <a className="btn" href={`/admin/coffre/${v.selfieRef}`} target="_blank" rel="noreferrer">Voir le selfie</a> : <span className="muted">Selfie non fourni</span>}
        </div>
        {v?.reviewedAt && <p className="small muted">Dernier contrôle : {dateTime(v.reviewedAt)} par {v.reviewedBy?.name ?? "—"}</p>}
        <form action={reviewVerification} className="stack">
          <input type="hidden" name="accountId" value={a.id} />
          <label className="check"><input type="checkbox" name="ageConfirmed" defaultChecked={v?.ageConfirmed} /> Pièce valable, la personne a 18 ans ou plus, et le selfie correspond</label>
          <label className="check"><input type="checkbox" name="cantonalRequired" defaultChecked={v?.cantonalRequired ?? cantonNeedsReg} /> Le canton exige un enregistrement {cantonNeedsReg && <span className="badge warn">probable pour ce canton</span>}</label>
          <div className="fields cols-2">
            <label>N° / référence d'enregistrement cantonal<input name="cantonalRegistrationRef" defaultValue={v?.cantonalRegistrationRef ?? ""} /></label>
            <label className="check" style={{ alignSelf: "end" }}><input type="checkbox" name="cantonalConfirmed" defaultChecked={v?.cantonalConfirmed} /> Enregistrement cantonal vérifié</label>
          </div>
          <label>Notes internes<textarea name="notes" defaultValue={v?.notes ?? ""} /></label>
          <div className="actions">
            <button className="btn primary" name="status" value="APPROVED">Valider l'identité</button>
            <button className="btn danger" name="status" value="REJECTED">Refuser</button>
            <button className="btn" name="status" value="PENDING">Laisser en attente</button>
          </div>
        </form>
      </section>

      <div className="grid two">
        <section className="card">
          <h2>Annonce</h2>
          {a.listing ? (
            <p><Link href={`/admin/annonces/${a.listing.id}`}>{a.listing.pseudo}</Link> <Badge value={a.listing.status} labels={LISTING_STATUS} /></p>
          ) : (
            <p className="muted">Pas encore d'annonce. <Link href={`/admin/annonces/nouvelle?compte=${a.id}`}>Créer l'annonce</Link></p>
          )}
          <h2 style={{ marginTop: 18 }}>Abonnements</h2>
          {a.subscriptions.length === 0 && <p className="muted">Aucun.</p>}
          <table><tbody>{a.subscriptions.map((s) => (
            <tr key={s.id}><td><Link href={`/admin/abonnements/${s.id}`}>{s.label}</Link></td><td><Badge value={s.status} labels={SUB_STATUS} /></td><td className="num small">→ {date(s.endDate)}</td></tr>
          ))}</tbody></table>
          <div className="actions" style={{ marginTop: 10 }}>
            <Link className="btn" href={`/admin/abonnements/nouveau?compte=${a.id}`}>+ Abonnement</Link>
            <Link className="btn" href={`/admin/factures/nouvelle?compte=${a.id}`}>+ Facture</Link>
          </div>
        </section>
        <section className="card">
          <h2>Factures</h2>
          {a.invoices.length === 0 && <p className="muted">Aucune.</p>}
          <table><tbody>{a.invoices.map((i) => (
            <tr key={i.id}><td><Link href={`/admin/factures/${i.id}`}>{i.number}</Link></td><td className="num">{chf(i.amountCents)}</td><td><Badge value={i.status} labels={INVOICE_STATUS} /></td></tr>
          ))}</tbody></table>
        </section>
      </div>

      <section className="card">
        <h2>Coordonnées</h2>
        <form action={saveAccount} className="stack">
          <input type="hidden" name="id" value={a.id} />
          <AccountFields a={a} />
          <div className="actions"><button className="btn primary">Enregistrer</button></div>
        </form>
      </section>

      <section className="card">
        <details className="danger-zone">
          <summary>Supprimer le compte et toutes ses données (droit à l'effacement)</summary>
          <p className="small muted">L'annonce, les photos, les statistiques et la vérification sont supprimées. Les factures sont conservées pour la comptabilité (10 ans, art. 958f CO).</p>
          <form action={deleteAccount} className="actions">
            <input type="hidden" name="id" value={a.id} />
            <input name="confirm" placeholder="Tapez SUPPRIMER" style={{ maxWidth: 200 }} />
            <button className="btn danger">Supprimer</button>
          </form>
        </details>
      </section>
    </>
  );
}

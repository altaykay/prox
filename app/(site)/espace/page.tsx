import Link from "next/link";
import { db } from "@/lib/db";
import { requirePro } from "@/lib/pro";
import { CANTONS_WITH_REGISTRATION, INVOICE_STATUS, LISTING_STATUS, PLAN_TYPE, SUB_STATUS } from "@/lib/constants";
import { chf, date, invoiceTotal, pct } from "@/lib/format";
import { sinceKey } from "@/lib/stats";
import { Badge } from "@/components/ui";
import { ListingFields } from "@/components/ListingFields";
import { getSettings } from "@/lib/settings";
import {
  addMyPhoto, deleteMyAccount, deleteMyListing, deleteMyPhoto, proLogout, requestPlan, saveMyBilling, saveMyListing, submitVerification, toggleMyPause,
} from "./actions";

export const dynamic = "force-dynamic";

const ERR: Record<string, string> = {
  documents: "Ajoutez la pièce d'identité et le selfie.", format: "Format de fichier non accepté (JPEG, PNG, WebP ou PDF ; 8–10 Mo max).",
  annonce: "Créez d'abord votre annonce.", photo: "Choisissez une photo.", maxphotos: "12 photos maximum.",
  confirmation: "Tapez SUPPRIMER pour confirmer.", suspendu: "Votre compte est suspendu. Contactez-nous.",
  attente: "Vous avez déjà une demande d'abonnement en attente de paiement.",
};

export default async function ProDashboard({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const sp = await searchParams;
  const me = await requirePro();
  const site = await getSettings();
  const [v, l, subs, invoices, plans] = await Promise.all([
    db.identityVerification.findUnique({ where: { accountId: me.id } }),
    db.listing.findUnique({ where: { accountId: me.id }, include: { photos: { orderBy: { position: "asc" } } } }),
    db.subscription.findMany({ where: { accountId: me.id }, orderBy: { createdAt: "desc" } }),
    db.invoice.findMany({ where: { accountId: me.id }, orderBy: { issueDate: "desc" } }),
    db.plan.findMany({ where: { active: true, type: { not: "CUSTOM" } }, orderBy: { priceCents: "asc" } }),
  ]);
  const unread = l ? await db.conversation.aggregate({ where: { listingId: l.id }, _sum: { ownerUnread: true } }) : null;
  const stats = l ? await db.listingStatDaily.aggregate({
    where: { listingId: l.id, day: { gte: sinceKey(30) } }, _sum: { views: true, phoneClicks: true, whatsappClicks: true, impressions: true },
  }) : null;

  const idOk = v?.status === "APPROVED";
  const idSent = !!v?.idDocumentRef;
  const photosOk = !!l && l.photos.length > 0;
  const live = l?.status === "PUBLISHED";
  const stepCls = (done: boolean, now: boolean) => `step ${done ? "done" : now ? "now" : ""}`;

  return (
    <>
      <div className="page-head">
        <h1>Mon espace</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {l && <Link className="btn small" href="/espace/messages">Messages{(unread?._sum.ownerUnread ?? 0) > 0 && ` (${unread?._sum.ownerUnread})`}</Link>}
          <form action={proLogout}><button className="btn small">Déconnexion</button></form>
        </div>
      </div>
      {sp.erreur && <div className="notice bad">{ERR[sp.erreur] ?? "Une erreur est survenue."}</div>}
      {sp.ok === "abonnement" && <div className="notice">Demande enregistrée. La facture est ci-dessous ; l'abonnement démarre dès réception du paiement.</div>}
      {me.status === "SUSPENDED" && <div className="notice bad">Votre compte est suspendu. Contactez l'équipe pour en savoir plus.</div>}

      <div className="steps" style={{ marginBottom: 18 }}>
        <div className={stepCls(idOk, !idOk)}><span className="dot">1</span><div><strong>Vérification d'identité et d'âge</strong><div className="small muted">{idOk ? "Validée" : v?.status === "REJECTED" ? "Refusée — renvoyez des documents lisibles" : idSent ? "Documents reçus, vérification en cours" : "À faire"}</div></div></div>
        <div className={stepCls(!!l, idSent && !l)}><span className="dot">2</span><div><strong>Votre annonce</strong><div className="small muted">{l ? <Badge value={l.status} labels={LISTING_STATUS} /> : "À rédiger"}</div></div></div>
        <div className={stepCls(photosOk, !!l && !photosOk)}><span className="dot">3</span><div><strong>Photos</strong><div className="small muted">{l ? `${l.photos.filter((p) => p.approved).length} validée(s) sur ${l.photos.length}` : "—"}</div></div></div>
        <div className={stepCls(live, false)}><span className="dot">4</span><div><strong>Publication</strong><div className="small muted">{live ? <Link href={`/annonce/${l!.id}`}>Voir mon annonce en ligne</Link> : "Après validation manuelle par notre équipe"}</div></div></div>
      </div>

      {!idOk && (
        <section className="card">
          <h2>Vérification d'identité</h2>
          <p className="small muted">Vos documents sont chiffrés et conservés séparément de votre annonce. Ils ne sont jamais publiés et ne servent qu'à vérifier votre âge et votre identité.</p>
          <form action={submitVerification} className="stack" encType="multipart/form-data">
            <label>Pièce d'identité ou passeport (recto, photo ou PDF)<input type="file" name="idDocument" required accept="image/jpeg,image/png,image/webp,application/pdf" /></label>
            <label>Selfie en tenant votre pièce d'identité<input type="file" name="selfie" required accept="image/jpeg,image/png,image/webp" capture="user" /></label>
            {(!l || CANTONS_WITH_REGISTRATION.includes(l.canton)) && (
              <label>Numéro ou référence d'enregistrement cantonal (si votre canton l'exige)<input name="cantonalRef" defaultValue={v?.cantonalRegistrationRef ?? ""} /></label>
            )}
            <button className="btn primary">{idSent ? "Renvoyer mes documents" : "Envoyer mes documents"}</button>
          </form>
        </section>
      )}

      {l && (
        <section className="card">
          <h2>Statistiques (30 derniers jours)</h2>
          <div className="grid kpis">
            <div className="kpi"><div className="label">Affichages</div><div className="value">{stats?._sum.impressions ?? 0}</div></div>
            <div className="kpi"><div className="label">Vues</div><div className="value">{stats?._sum.views ?? 0}</div></div>
            <div className="kpi"><div className="label">Appels</div><div className="value">{stats?._sum.phoneClicks ?? 0}</div></div>
            <div className="kpi"><div className="label">WhatsApp</div><div className="value">{stats?._sum.whatsappClicks ?? 0}</div><div className="small muted">{pct((stats?._sum.phoneClicks ?? 0) + (stats?._sum.whatsappClicks ?? 0), stats?._sum.views ?? 0)} de contact</div></div>
          </div>
        </section>
      )}

      <section className="card">
        <div className="page-head" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>{l ? "Mon annonce" : "Rédiger mon annonce"}</h2>
          {l && (l.status === "PUBLISHED" || l.status === "PAUSED") && (
            <form action={toggleMyPause}><button className="btn">{l.status === "PUBLISHED" ? "Mettre en pause" : "Réactiver"}</button></form>
          )}
        </div>
        {l && <p className="small muted">Chaque modification est relue par notre équipe avant d'être de nouveau visible.</p>}
        <form action={saveMyListing} className="stack">
          <ListingFields l={l ?? { phone: me.phone }} />
          <div className="actions"><button className="btn primary">{l ? "Enregistrer et envoyer en modération" : "Envoyer en modération"}</button></div>
        </form>
      </section>

      {l && (
        <section className="card">
          <h2>Mes photos</h2>
          <p className="small muted">Le visage n'est pas obligatoire, vous pouvez flouter. Pas de contenu explicite. Chaque photo est validée avant d'apparaître.</p>
          <div className="photos" style={{ marginBottom: 12 }}>
            {l.photos.map((p) => (
              <div key={p.id} className="photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className={p.blurred ? "blur" : ""} />
                <div className="p-body">
                  {p.approved ? <span className="badge ok">En ligne</span> : <span className="badge warn">En validation</span>}
                  <form action={deleteMyPhoto}><input type="hidden" name="id" value={p.id} /><button className="btn small">Supprimer</button></form>
                </div>
              </div>
            ))}
          </div>
          <form action={addMyPhoto} className="actions" encType="multipart/form-data">
            <input type="file" name="file" required accept="image/jpeg,image/png,image/webp" style={{ maxWidth: 260 }} />
            <label className="check"><input type="checkbox" name="blurred" /> Flouter</label>
            <button className="btn">Ajouter</button>
          </form>
        </section>
      )}

      <section className="card">
        <h2>Services optionnels</h2>
        <p className="small muted">Votre annonce reste gratuite. Ces services sont facultatifs.</p>
        <div className="grid two">
          {plans.map((p) => (
            <div key={p.id} className="kpi">
              <div style={{ fontFamily: "var(--serif)", fontSize: "1.1rem" }}>{p.name}</div>
              <div className="small muted">{PLAN_TYPE[p.type]} · {p.durationMonths} mois</div>
              <p className="small">{p.description}</p>
              <div className="actions" style={{ justifyContent: "space-between" }}>
                <strong>{chf(p.priceCents)}</strong>
                <form action={requestPlan}><input type="hidden" name="planId" value={p.id} /><button className="btn small">Choisir</button></form>
              </div>
            </div>
          ))}
        </div>
        {subs.length > 0 && (
          <table style={{ marginTop: 14 }}><tbody>{subs.map((s) => (
            <tr key={s.id}><td>{s.label}</td><td><Badge value={s.status} labels={SUB_STATUS} /></td><td className="small">{date(s.startDate)} → {date(s.endDate)}</td></tr>
          ))}</tbody></table>
        )}
        {invoices.length > 0 && (
          <>
            <h3 style={{ marginTop: 14 }}>Mes factures</h3>
            <table><tbody>{invoices.map((i) => (
              <tr key={i.id}><td>{i.number}<div className="small muted">{i.label}</div></td><td className="num">{chf(invoiceTotal(i.amountCents, i.vatRateBp))}</td><td><Badge value={i.status} labels={INVOICE_STATUS} /></td><td className="small">échéance {date(i.dueDate)}</td></tr>
            ))}</tbody></table>
            <p className="small muted">Paiement par virement : IBAN {site.issuerIban || "communiqué sur la facture"}, référence = numéro de facture.</p>
          </>
        )}
      </section>

      <section className="card">
        <h2>Mes coordonnées</h2>
        <form action={saveMyBilling} className="stack">
          <div className="fields cols-2">
            <label>Téléphone du compte<input name="phone" defaultValue={me.phone} /></label>
            <label>Nom pour les factures<input name="billingName" defaultValue={me.billingName ?? ""} /></label>
            <label>Adresse<input name="billingAddress" defaultValue={me.billingAddress ?? ""} /></label>
            <div className="fields cols-2"><label>NPA<input name="billingZip" defaultValue={me.billingZip ?? ""} /></label><label>Localité<input name="billingCity" defaultValue={me.billingCity ?? ""} /></label></div>
          </div>
          <div><button className="btn">Enregistrer</button></div>
        </form>
      </section>

      <section className="card">
        {l && (
          <details className="danger-zone" style={{ marginBottom: 12 }}>
            <summary>Supprimer mon annonce</summary>
            <form action={deleteMyListing} className="actions" style={{ marginTop: 10 }}>
              <input name="confirm" placeholder="Tapez SUPPRIMER" style={{ maxWidth: 200 }} /><button className="btn danger">Supprimer l'annonce</button>
            </form>
          </details>
        )}
        <details className="danger-zone">
          <summary>Supprimer mon compte et toutes mes données</summary>
          <p className="small muted">Annonce, photos, statistiques et documents d'identité sont effacés définitivement. Seules les factures éventuelles sont conservées (obligation légale).</p>
          <form action={deleteMyAccount} className="actions">
            <input name="confirm" placeholder="Tapez SUPPRIMER" style={{ maxWidth: 200 }} /><button className="btn danger">Supprimer mon compte</button>
          </form>
        </details>
      </section>
    </>
  );
}

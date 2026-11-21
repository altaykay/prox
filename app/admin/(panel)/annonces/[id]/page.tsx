import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CANTONS, LISTING_STATUS, REPORT_REASON, VERIFICATION_STATUS } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { Badge, Notice } from "@/components/ui";
import { ListingFields } from "@/components/ListingFields";
import { addPhoto, deleteListing, saveListing, setListingStatus, updatePhoto } from "../../../actions";

export default async function ListingDetail({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const l = await db.listing.findUnique({
    where: { id },
    include: {
      account: { include: { verification: true } },
      photos: { orderBy: { position: "asc" } },
      reports: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!l) notFound();
  const logs = await db.moderationLog.findMany({ where: { targetType: "listing", targetId: id }, orderBy: { createdAt: "desc" }, take: 10, include: { admin: true } });
  const v = l.account.verification;

  const StatusBtn = ({ status, label, cls = "btn" }: { status: string; label: string; cls?: string }) => (
    <form action={setListingStatus}>
      <input type="hidden" name="id" value={l.id} /><input type="hidden" name="status" value={status} />
      <button className={cls}>{label}</button>
    </form>
  );

  return (
    <>
      <div className="page-head">
        <h1>{l.pseudo} <Badge value={l.status} labels={LISTING_STATUS} /></h1>
        <div className="actions">
          <Link className="btn" href={`/admin/statistiques/${l.id}`}>Statistiques</Link>
          {l.status === "PUBLISHED" && <Link className="btn" href={`/annonce/${l.id}`} target="_blank">Voir en ligne</Link>}
        </div>
      </div>
      <Notice sp={sp} />

      <section className="card">
        <h2>Modération</h2>
        <dl className="meta" style={{ marginBottom: 12 }}>
          <dt>Compte</dt><dd><Link href={`/admin/comptes/${l.accountId}`}>{l.account.email}</Link></dd>
          <dt>Identité / âge</dt><dd><Badge value={v?.status ?? "PENDING"} labels={VERIFICATION_STATUS} /></dd>
          <dt>Enreg. cantonal</dt><dd>{v?.cantonalRequired ? (v.cantonalConfirmed ? "Exigé · confirmé" : "Exigé · NON confirmé") : "Non exigé"}</dd>
          <dt>Photos à valider</dt><dd>{l.photos.filter((p) => !p.approved).length}</dd>
          <dt>Publiée le</dt><dd>{dateTime(l.publishedAt)}</dd>
        </dl>
        <div className="actions">
          {l.status !== "PUBLISHED" && <StatusBtn status="PUBLISHED" label="Valider et publier" cls="btn primary" />}
          {l.status === "PUBLISHED" && <StatusBtn status="PAUSED" label="Mettre en pause" />}
          {l.status !== "REJECTED" && l.status !== "PUBLISHED" && <StatusBtn status="REJECTED" label="Refuser" />}
          {l.status !== "SUSPENDED" && <StatusBtn status="SUSPENDED" label="Suspendre" cls="btn danger" />}
          {(l.status === "SUSPENDED" || l.status === "REJECTED") && <StatusBtn status="PENDING_REVIEW" label="Remettre en modération" />}
        </div>
      </section>

      <section className="card">
        <h2>Photos</h2>
        <p className="muted small">Aucun contenu pornographique explicite. Le visage n'est pas obligatoire ; le floutage est possible.</p>
        <div className="photos" style={{ marginBottom: 14 }}>
          {l.photos.map((p) => (
            <div key={p.id} className="photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className={p.blurred ? "blur" : ""} />
              <div className="p-body">
                <div>{p.approved ? <span className="badge ok">Validée</span> : <span className="badge warn">À valider</span>}{p.source === "STUDIO" && <> <span className="badge accent">Équipe</span></>}</div>
                <div className="actions">
                  <PhotoBtn id={p.id} op={p.approved ? "unapprove" : "approve"} label={p.approved ? "Retirer" : "Valider"} />
                  <PhotoBtn id={p.id} op="blur" label={p.blurred ? "Déflouter" : "Flouter"} />
                  <PhotoBtn id={p.id} op="delete" label="Suppr." />
                </div>
              </div>
            </div>
          ))}
        </div>
        <form action={addPhoto} className="fields cols-3" encType="multipart/form-data">
          <input type="hidden" name="listingId" value={l.id} />
          <label>Fichier<input type="file" name="file" accept="image/jpeg,image/png,image/webp" /></label>
          <label>Source
            <select name="source" defaultValue="OWNER"><option value="OWNER">Annonceuse</option><option value="STUDIO">Séance photo de l'équipe</option></select>
          </label>
          <div style={{ display: "grid", gap: 8, alignContent: "end" }}>
            <label className="check"><input type="checkbox" name="blurred" /> Flouter</label>
            <button className="btn">Ajouter la photo</button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Contenu de l'annonce</h2>
        <form action={saveListing} className="stack">
          <input type="hidden" name="id" value={l.id} />
          <ListingFields l={l} />
          <div className="actions"><button className="btn primary">Enregistrer</button></div>
        </form>
      </section>

      {l.reports.length > 0 && (
        <section className="card">
          <h2>Signalements</h2>
          <table><tbody>{l.reports.map((r) => (
            <tr key={r.id}><td><Link href={`/admin/signalements/${r.id}`}>{REPORT_REASON[r.reason]}</Link></td><td>{r.status}</td><td className="muted small">{dateTime(r.createdAt)}</td></tr>
          ))}</tbody></table>
        </section>
      )}

      <section className="card">
        <h2>Historique</h2>
        <table><tbody>{logs.map((g) => (
          <tr key={g.id}><td className="muted small">{dateTime(g.createdAt)}</td><td>{g.action}</td><td className="muted small">{g.admin?.name ?? "Annonceuse / système"}</td></tr>
        ))}</tbody></table>
      </section>

      <section className="card">
        <details className="danger-zone">
          <summary>Supprimer définitivement cette annonce</summary>
          <form action={deleteListing} className="actions" style={{ marginTop: 10 }}>
            <input type="hidden" name="id" value={l.id} />
            <input name="confirm" placeholder="Tapez SUPPRIMER" style={{ maxWidth: 200 }} />
            <button className="btn danger">Supprimer</button>
          </form>
        </details>
      </section>
      <p className="muted small">{CANTONS[l.canton]} · créée le {dateTime(l.createdAt)}</p>
    </>
  );
}

function PhotoBtn({ id, op, label }: { id: string; op: string; label: string }) {
  return (
    <form action={updatePhoto}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={op} />
      <button className="btn small">{label}</button>
    </form>
  );
}

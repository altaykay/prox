import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { HELP_CONTACTS, LISTING_STATUS, REPORT_REASON, REPORT_STATUS } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { Badge, Notice } from "@/components/ui";
import { updateReport } from "../../../actions";

export default async function ReportDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const r = await db.report.findUnique({ where: { id }, include: { listing: true, handledBy: true } });
  if (!r) notFound();
  const serious = ["TRAFFICKING", "MINOR"].includes(r.reason);
  return (
    <>
      <div className="page-head"><h1>Signalement <Badge value={r.reason} labels={REPORT_REASON} /></h1></div>
      <Notice sp={sp} />
      {serious && (
        <div className="notice bad">
          Procédure : 1) suspendre l'annonce, 2) appeler la police au 117 en cas de danger immédiat, 3) transmettre aux services spécialisés ci-dessous, 4) consigner la suite donnée.
        </div>
      )}
      <div className="grid two">
        <section className="card">
          <dl className="meta">
            <dt>Reçu le</dt><dd>{dateTime(r.createdAt)}</dd>
            <dt>Annonce</dt><dd>{r.listing ? <><Link href={`/admin/annonces/${r.listing.id}`}>{r.listing.pseudo}</Link> <Badge value={r.listing.status} labels={LISTING_STATUS} /></> : "—"}</dd>
            <dt>Contact</dt><dd>{r.contact || "Anonyme"}</dd>
            <dt>Traité par</dt><dd>{r.handledBy?.name ?? "—"}</dd>
          </dl>
          <p style={{ whiteSpace: "pre-wrap", marginTop: 14 }}>{r.message}</p>
        </section>
        <section className="card">
          <h2>Contacts</h2>
          <ul className="small">{HELP_CONTACTS.map((c) => <li key={c.name}>{c.name} — {c.detail}</li>)}</ul>
        </section>
      </div>
      <section className="card">
        <form action={updateReport} className="stack">
          <input type="hidden" name="id" value={r.id} />
          <label>Statut<select name="status" defaultValue={r.status}>{Object.entries(REPORT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label>Suite donnée<textarea name="resolution" defaultValue={r.resolution ?? ""} placeholder="Ex. annonce suspendue, transmis à la police le…" /></label>
          {r.listing && r.listing.status !== "SUSPENDED" && <label className="check"><input type="checkbox" name="suspendListing" defaultChecked={serious} /> Suspendre l'annonce</label>}
          <div className="actions"><button className="btn primary">Enregistrer</button></div>
        </form>
      </section>
    </>
  );
}

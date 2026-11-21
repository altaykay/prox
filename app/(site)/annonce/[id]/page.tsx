import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CANTONS, LANGUAGES } from "@/lib/constants";
import { publicListingInclude, telLink, waLink } from "@/lib/public";
import { ContactButtons, TrackView } from "@/components/Track";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await db.listing.findFirst({ where: { id, status: "PUBLISHED", account: { status: "VERIFIED" } }, include: publicListingInclude });
  if (!l) notFound();
  const services = l.services.split(",").map((s) => s.trim()).filter(Boolean);
  const langs = l.languages.split(",").filter(Boolean);
  const contact = <ContactButtons id={l.id} tel={telLink(l.phone)} wa={l.whatsapp ? waLink(l.phone) : undefined} />;

  return (
    <>
      <TrackView id={l.id} />
      <p className="small"><Link href={`/?canton=${l.canton}`}>← {CANTONS[l.canton]}</Link></p>
      {l.photos.length > 0 && (
        <div className="gallery">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {l.photos.map((p) => <img key={p.id} src={p.url} alt={`Photo de ${l.pseudo}`} className={p.blurred ? "blur" : ""} />)}
        </div>
      )}
      <div className="detail">
        <div>
          <h1 style={{ marginBottom: 2 }}>{l.pseudo}</h1>
          <p className="muted" style={{ marginTop: 0 }}>{l.city}{CANTONS[l.canton] !== l.city && ` · ${CANTONS[l.canton]}`} <span className="badge ok" style={{ marginLeft: 6 }}>Identité vérifiée</span></p>
          <p style={{ whiteSpace: "pre-wrap" }}>{l.description}</p>
          {services.length > 0 && (<><h2>Prestations</h2><div className="chips">{services.map((s) => <span key={s} className="chip">{s}</span>)}</div></>)}
          {langs.length > 0 && (<><h2 style={{ marginTop: 20 }}>Langues</h2><div className="chips">{langs.map((k) => <span key={k} className="chip">{LANGUAGES[k] ?? k}</span>)}</div></>)}
        </div>
        <aside className="grid">
          <div className="card hide-mobile" style={{ margin: 0 }}>
            {contact}
            <p className="small muted" style={{ marginBottom: 0 }}>Mentionnez Prox lors de votre appel.</p>
          </div>
          {l.rates && <div className="card" style={{ margin: 0 }}><h3>Tarifs</h3><p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{l.rates}</p></div>}
          {l.hours && <div className="card" style={{ margin: 0 }}><h3>Horaires</h3><p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{l.hours}</p></div>}
          <div className="card small" style={{ margin: 0 }}>
            <Link href={`/signaler?annonce=${l.id}`}>Signaler cette annonce</Link>
            <p className="muted" style={{ marginBottom: 0 }}>Un doute sur la traite, la contrainte ou l'âge ? <Link href="/aide">Que faire</Link></p>
          </div>
        </aside>
      </div>
      <div className="sticky-contact">{contact}</div>
      <div style={{ height: 70 }} />
    </>
  );
}

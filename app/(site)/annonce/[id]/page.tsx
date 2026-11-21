import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CANTONS, LANGUAGES } from "@/lib/constants";
import { publicListingInclude, telLink, waLink } from "@/lib/public";
import { ContactButtons, TrackView } from "@/components/Track";
import { getSettings } from "@/lib/settings";
import { MSG_MAX, NAME_MAX } from "@/lib/messages";
import { startConversation } from "../../messages/actions";

export const dynamic = "force-dynamic";

const MSG: Record<string, [string, string]> = {
  erreur: ["bad", "Indiquez un prénom ou pseudo et un message."],
  indisponible: ["bad", "Cette annonce ne reçoit pas de messages."],
  ok: ["", "Message envoyé."],
};

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const site = await getSettings();
  const l = await db.listing.findFirst({ where: { id, status: "PUBLISHED", account: { status: "VERIFIED" } }, include: publicListingInclude });
  if (!l) notFound();
  const services = l.services.split(",").map((s) => s.trim()).filter(Boolean);
  const langs = l.languages.split(",").filter(Boolean);
  const demo = l.account.isDemo;
  const contact = demo
    ? <div className="notice" style={{ margin: 0 }}>Annonce d'exemple : numéro fictif, contact désactivé.</div>
    : <ContactButtons id={l.id} tel={telLink(l.phone)} wa={l.whatsapp ? waLink(l.phone) : undefined} />;
  const note = sp.message ? MSG[sp.message] : undefined;

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
          <p className="muted" style={{ marginTop: 0 }}>{l.city}{CANTONS[l.canton] !== l.city && ` · ${CANTONS[l.canton]}`} {demo ? <span className="badge warn" style={{ marginLeft: 6 }}>Exemple fictif</span> : <span className="badge ok" style={{ marginLeft: 6 }}>Identité vérifiée</span>}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{l.description}</p>
          {services.length > 0 && (<><h2>Prestations</h2><div className="chips">{services.map((s) => <span key={s} className="chip">{s}</span>)}</div></>)}
          {langs.length > 0 && (<><h2 style={{ marginTop: 20 }}>Langues</h2><div className="chips">{langs.map((k) => <span key={k} className="chip">{LANGUAGES[k] ?? k}</span>)}</div></>)}
        </div>
        <aside className="grid">
          <div className="card hide-mobile" style={{ margin: 0 }}>
            {contact}
            {!demo && <p className="small muted" style={{ marginBottom: 0 }}>Mentionnez {site.siteName} lors de votre appel.</p>}
          </div>
          <div className="card" id="message" style={{ margin: 0 }}>
            <h3>Envoyer un message</h3>
            {note && <div className={`notice ${note[0]}`}>{note[1]}</div>}
            {demo ? (
              <p className="small muted" style={{ margin: 0 }}>La messagerie est désactivée sur les annonces d'exemple.</p>
            ) : (
              <form action={startConversation}>
                <input type="hidden" name="listingId" value={l.id} />
                <div className="hp" aria-hidden="true"><label>Site <input name="site" tabIndex={-1} autoComplete="off" /></label></div>
                <label>Votre prénom ou pseudo<input name="name" required minLength={2} maxLength={NAME_MAX} /></label>
                <label>Message<textarea name="body" required minLength={2} maxLength={MSG_MAX} rows={4} placeholder="Bonjour, je souhaiterais…" /></label>
                <button className="btn primary" style={{ width: "100%" }}>Envoyer</button>
                <p className="small muted" style={{ marginBottom: 0 }}>Sans compte. Votre numéro reste privé ; vous retrouvez la réponse dans « Messages ».</p>
              </form>
            )}
          </div>
          {l.rates && <div className="card" style={{ margin: 0 }}><h3>Tarifs</h3><p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{l.rates}</p></div>}
          {l.hours && <div className="card" style={{ margin: 0 }}><h3>Horaires</h3><p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{l.hours}</p></div>}
          <div className="card small" style={{ margin: 0 }}>
            <Link href={`/signaler?annonce=${l.id}`}>Signaler cette annonce</Link>
            <p className="muted" style={{ marginBottom: 0 }}>Un doute sur la traite, la contrainte ou l'âge ? <Link href="/aide">Que faire</Link></p>
          </div>
        </aside>
      </div>
      {!demo && <div className="sticky-contact">{contact}<a className="btn" href="#message" style={{ marginTop: 6, width: "100%" }}>Message</a></div>}
      <div style={{ height: demo ? 10 : 120 }} />
    </>
  );
}

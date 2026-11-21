import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MSG_MAX, validToken } from "@/lib/messages";
import { dateTime } from "@/lib/format";
import { visitorReply } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversation", robots: { index: false } };

const ERR: Record<string, string> = {
  bloque: "L'annonceuse a fermé cette conversation.",
  attente: "Attendez sa réponse avant d'envoyer d'autres messages.",
};

export default async function VisitorConversation({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ nouveau?: string; erreur?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  if (!validToken(token)) notFound();
  const c = await db.conversation.findUnique({
    where: { token },
    include: { listing: { select: { id: true, pseudo: true, status: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!c) notFound();
  if (c.visitorUnread > 0) await db.conversation.update({ where: { id: c.id }, data: { visitorUnread: 0 } });

  return (
    <>
      <p className="small"><Link href="/messages">← Mes messages</Link></p>
      <h1>Conversation avec {c.listing.status === "PUBLISHED" ? <Link href={`/annonce/${c.listing.id}`}>{c.listing.pseudo}</Link> : c.listing.pseudo}</h1>
      {sp.nouveau && (
        <div className="notice">
          Message envoyé. Elle vous répondra ici. Gardez ce lien privé pour revenir plus tard, il est aussi enregistré dans ce navigateur (rubrique « Messages »).
        </div>
      )}
      {sp.erreur && <div className="notice bad">{ERR[sp.erreur] ?? "Une erreur est survenue."}</div>}
      <div className="chat">
        {c.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.fromOwner ? "" : "me"}`}>
            {m.body}
            <span className="t">{m.fromOwner ? c.listing.pseudo : "Vous"} · {dateTime(m.createdAt)}</span>
          </div>
        ))}
      </div>
      {c.blocked ? (
        <div className="notice bad">{ERR.bloque}</div>
      ) : (
        <form action={visitorReply} className="card">
          <input type="hidden" name="token" value={token} />
          <div className="hp" aria-hidden="true"><label>Site <input name="site" tabIndex={-1} autoComplete="off" /></label></div>
          <label>Votre message<textarea name="body" required maxLength={MSG_MAX} rows={3} /></label>
          <button className="btn primary">Envoyer</button>
        </form>
      )}
      <p className="small muted">Ne partagez jamais de code, de mot de passe ni d'acompte. En cas de doute, <Link href={`/signaler?annonce=${c.listing.id}`}>signalez l'annonce</Link>.</p>
    </>
  );
}

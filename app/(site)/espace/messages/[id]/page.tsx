import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePro } from "@/lib/pro";
import { MSG_MAX } from "@/lib/messages";
import { dateTime } from "@/lib/format";
import { deleteConversation, ownerReply, toggleBlock } from "../../../messages/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversation", robots: { index: false } };

export default async function ProConversation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requirePro();
  const c = await db.conversation.findFirst({
    where: { id, listing: { accountId: me.id } }, include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!c) notFound();
  if (c.ownerUnread > 0) await db.conversation.update({ where: { id: c.id }, data: { ownerUnread: 0 } });

  return (
    <>
      <p className="small"><Link href="/espace/messages">← Messages reçus</Link></p>
      <div className="page-head">
        <h1>{c.visitorName}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <form action={toggleBlock}><input type="hidden" name="id" value={c.id} /><button className="btn small">{c.blocked ? "Débloquer" : "Bloquer"}</button></form>
          <form action={deleteConversation}><input type="hidden" name="id" value={c.id} /><button className="btn small danger">Supprimer</button></form>
        </div>
      </div>
      {c.blocked && <div className="notice bad">Conversation bloquée : cette personne ne peut plus vous écrire.</div>}
      <div className="chat">
        {c.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.fromOwner ? "me" : ""}`}>
            {m.body}
            <span className="t">{m.fromOwner ? "Vous" : c.visitorName} · {dateTime(m.createdAt)}</span>
          </div>
        ))}
      </div>
      {!c.blocked && (
        <form action={ownerReply} className="card">
          <input type="hidden" name="id" value={c.id} />
          <label>Votre réponse<textarea name="body" required maxLength={MSG_MAX} rows={3} /></label>
          <button className="btn primary">Répondre</button>
        </form>
      )}
      <p className="small muted">Une personne insistante ou menaçante ? Bloquez-la, puis prévenez-nous via <Link href="/aide">l'aide</Link>.</p>
    </>
  );
}

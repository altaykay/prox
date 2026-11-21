import Link from "next/link";
import { db } from "@/lib/db";
import { requirePro } from "@/lib/pro";
import { dateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages reçus", robots: { index: false } };

export default async function ProMessages() {
  const me = await requirePro();
  const convs = await db.conversation.findMany({
    where: { listing: { accountId: me.id } }, orderBy: { updatedAt: "desc" }, take: 200,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return (
    <>
      <p className="small"><Link href="/espace">← Mon espace</Link></p>
      <h1>Messages reçus</h1>
      <p className="muted">Les visiteurs vous écrivent depuis votre annonce, sans voir votre numéro ni votre e-mail. Vous pouvez bloquer une conversation à tout moment.</p>
      {convs.length === 0 ? (
        <div className="card">Aucun message pour l'instant.</div>
      ) : (
        <div className="card">
          <ul className="conv-list">
            {convs.map((c) => (
              <li key={c.id}>
                <Link href={`/espace/messages/${c.id}`}>
                  <span>
                    <strong>{c.visitorName}</strong>
                    {c.ownerUnread > 0 && <span className="badge accent" style={{ marginLeft: 8 }}>{c.ownerUnread} nouveau(x)</span>}
                    {c.blocked && <span className="badge bad" style={{ marginLeft: 8 }}>Bloquée</span>}
                    <span className="small muted" style={{ display: "block" }}>{(c.messages[0]?.body ?? "").slice(0, 90)}</span>
                  </span>
                  <span className="small muted">{dateTime(c.updatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

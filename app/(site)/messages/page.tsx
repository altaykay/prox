import Link from "next/link";
import { db } from "@/lib/db";
import { myTokens } from "@/lib/messages";
import { dateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes messages", robots: { index: false } };

export default async function MyMessages() {
  const tokens = await myTokens();
  const convs = tokens.length ? await db.conversation.findMany({
    where: { token: { in: tokens } }, orderBy: { updatedAt: "desc" },
    include: { listing: { select: { pseudo: true, city: true } } },
  }) : [];
  return (
    <>
      <h1>Mes messages</h1>
      <p className="muted">Vos conversations sont gardées dans ce navigateur, sans compte. Pour les retrouver ailleurs, conservez le lien privé de chaque conversation.</p>
      {convs.length === 0 ? (
        <div className="card">Aucune conversation pour l'instant. Ouvrez une annonce et utilisez « Envoyer un message ».</div>
      ) : (
        <div className="card">
          <ul className="conv-list">
            {convs.map((c) => (
              <li key={c.id}>
                <Link href={`/messages/${c.token}`}>
                  <span><strong>{c.listing.pseudo}</strong> <span className="muted small">· {c.listing.city}</span>{c.visitorUnread > 0 && <span className="badge accent" style={{ marginLeft: 8 }}>{c.visitorUnread} nouveau(x)</span>}</span>
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

import Link from "next/link";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/format";

const HREF: Record<string, string> = { listing: "annonces", account: "comptes", subscription: "abonnements", invoice: "factures", report: "signalements" };

export default async function Journal({ searchParams }: { searchParams: Promise<{ page?: string; type?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = sp.type ? { targetType: sp.type } : {};
  const logs = await db.moderationLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 100, take: 100, include: { admin: true } });
  return (
    <>
      <div className="page-head"><h1>Journal des actions</h1></div>
      <p className="muted small">Toutes les actions de l'équipe et des annonceuses sont inscrites ici. Le journal ne peut pas être modifié depuis l'interface.</p>
      <div className="filters">
        <Link href="/admin/journal" className={!sp.type ? "on" : ""}>Tout</Link>
        {Object.entries({ listing: "Annonces", account: "Comptes", subscription: "Abonnements", invoice: "Factures", report: "Signalements", admin: "Équipe" }).map(([k, v]) => (
          <Link key={k} href={`/admin/journal?type=${k}`} className={sp.type === k ? "on" : ""}>{v}</Link>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Par</th><th>Action</th><th>Cible</th><th>Détails</th></tr></thead>
          <tbody>{logs.map((g) => (
            <tr key={g.id}>
              <td className="small">{dateTime(g.createdAt)}</td>
              <td>{g.admin?.name ?? <span className="muted">Annonceuse / système</span>}</td>
              <td>{g.action}</td>
              <td className="small">{HREF[g.targetType] ? <Link href={`/admin/${HREF[g.targetType]}/${g.targetId}`}>{g.targetType}</Link> : g.targetType}</td>
              <td className="small muted" style={{ maxWidth: 280, overflowWrap: "anywhere" }}>{g.details}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="actions" style={{ marginTop: 12 }}>
        {page > 1 && <Link className="btn" href={`/admin/journal?page=${page - 1}${sp.type ? `&type=${sp.type}` : ""}`}>← Plus récent</Link>}
        {logs.length === 100 && <Link className="btn" href={`/admin/journal?page=${page + 1}${sp.type ? `&type=${sp.type}` : ""}`}>Plus ancien →</Link>}
      </div>
    </>
  );
}

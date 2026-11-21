import Link from "next/link";
import type { AccountStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ACCOUNT_STATUS, LISTING_STATUS } from "@/lib/constants";
import { date } from "@/lib/format";
import { Badge, Empty, Filters, Notice } from "@/components/ui";

export default async function Accounts({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string; ok?: string }> }) {
  const sp = await searchParams;
  const accounts = await db.account.findMany({
    where: {
      ...(sp.statut ? { status: sp.statut as AccountStatus } : {}),
      ...(sp.q ? { OR: [{ email: { contains: sp.q } }, { phone: { contains: sp.q } }] } : {}),
    },
    orderBy: { createdAt: "desc" }, take: 200,
    include: { listing: true, subscriptions: { where: { status: "ACTIVE" } } },
  });
  return (
    <>
      <div className="page-head"><h1>Comptes</h1><Link href="/admin/comptes/nouveau" className="btn primary">+ Nouveau compte</Link></div>
      <Notice sp={sp} />
      <Filters base="/admin/comptes" current={sp.statut} options={ACCOUNT_STATUS} />
      <form className="filters" style={{ marginTop: -6 }}>
        <input name="q" defaultValue={sp.q} placeholder="E-mail ou téléphone…" /><button className="btn">Rechercher</button>
      </form>
      <div className="table-wrap">
        {accounts.length === 0 ? <Empty>Aucun compte.</Empty> : (
          <table>
            <thead><tr><th>E-mail</th><th>Statut</th><th>Annonce</th><th>Abonnement</th><th>Créé le</th></tr></thead>
            <tbody>{accounts.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/admin/comptes/${a.id}`}>{a.email}</Link><br /><span className="muted small">{a.phone}</span></td>
                <td><Badge value={a.status} labels={ACCOUNT_STATUS} /></td>
                <td>{a.listing ? <><Link href={`/admin/annonces/${a.listing.id}`}>{a.listing.pseudo}</Link> <Badge value={a.listing.status} labels={LISTING_STATUS} /></> : <span className="muted">—</span>}</td>
                <td>{a.subscriptions[0]?.label ?? <span className="muted">—</span>}</td>
                <td className="muted small">{date(a.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}

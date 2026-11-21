import Link from "next/link";
import type { Prisma, ListingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { CANTONS, LISTING_STATUS } from "@/lib/constants";
import { date } from "@/lib/format";
import { Badge, Empty, Filters, Notice } from "@/components/ui";

export default async function Listings({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string; ok?: string }> }) {
  const sp = await searchParams;
  const where: Prisma.ListingWhereInput = {};
  if (sp.statut) where.status = sp.statut as ListingStatus;
  if (sp.q) where.OR = [{ pseudo: { contains: sp.q } }, { city: { contains: sp.q } }, { phone: { contains: sp.q } }];
  const listings = await db.listing.findMany({
    where, orderBy: { updatedAt: "desc" }, take: 200,
    include: { account: { include: { verification: true } }, _count: { select: { photos: true, reports: true } } },
  });
  return (
    <>
      <div className="page-head">
        <h1>Annonces</h1>
        <Link href="/admin/annonces/nouvelle" className="btn primary">+ Nouvelle annonce</Link>
      </div>
      <Notice sp={sp} />
      <Filters base="/admin/annonces" current={sp.statut} options={LISTING_STATUS} />
      <form className="filters" style={{ marginTop: -6 }}>
        {sp.statut && <input type="hidden" name="statut" value={sp.statut} />}
        <input name="q" defaultValue={sp.q} placeholder="Rechercher un pseudo, une ville, un numéro…" />
        <button className="btn">Rechercher</button>
      </form>
      <div className="table-wrap">
        {listings.length === 0 ? <Empty>Aucune annonce.</Empty> : (
          <table>
            <thead><tr><th>Pseudo</th><th>Lieu</th><th>Statut</th><th>Identité</th><th className="num">Photos</th><th className="num">Signal.</th><th>Mise à jour</th></tr></thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id}>
                  <td><Link href={`/admin/annonces/${l.id}`}>{l.pseudo}</Link>{l.highlighted && <> <span className="badge accent">En avant</span></>}</td>
                  <td>{l.city} <span className="muted small">{CANTONS[l.canton] ?? l.canton}</span></td>
                  <td><Badge value={l.status} labels={LISTING_STATUS} /></td>
                  <td><Badge value={l.account.verification?.status ?? "PENDING"} labels={{ PENDING: "À vérifier", APPROVED: "Vérifiée", REJECTED: "Refusée" }} /></td>
                  <td className="num">{l._count.photos}</td>
                  <td className="num">{l._count.reports || "—"}</td>
                  <td className="muted small">{date(l.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

import Link from "next/link";
import type { ReportStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { REPORT_REASON, REPORT_STATUS } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { Badge, Empty, Filters } from "@/components/ui";

export default async function Reports({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const sp = await searchParams;
  const reports = await db.report.findMany({
    where: sp.statut ? { status: sp.statut as ReportStatus } : { status: { not: "CLOSED" } },
    include: { listing: true }, take: 300,
  });
  // Urgents d'abord (traite, minorité), puis les plus récents
  const urgent = (r: { reason: string }) => (["TRAFFICKING", "MINOR"].includes(r.reason) ? 0 : 1);
  reports.sort((a, b) => urgent(a) - urgent(b) || b.createdAt.getTime() - a.createdAt.getTime());
  return (
    <>
      <div className="page-head"><h1>Signalements</h1></div>
      <div className="notice warn">Soupçon de traite, de contrainte ou de minorité : suspendre l'annonce immédiatement et transmettre à la police (117) et/ou à la plateforme spécialisée. Ne pas contacter l'annonceuse d'une façon qui pourrait la mettre en danger.</div>
      <Filters base="/admin/signalements" current={sp.statut} options={REPORT_STATUS} />
      <div className="table-wrap">
        {reports.length === 0 ? <Empty>Aucun signalement {sp.statut ? "" : "ouvert"}.</Empty> : (
          <table>
            <thead><tr><th>Motif</th><th>Annonce</th><th>Statut</th><th>Reçu</th></tr></thead>
            <tbody>{reports.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/admin/signalements/${r.id}`}><Badge value={r.reason} labels={REPORT_REASON} /></Link><div className="small muted">{r.message.slice(0, 90)}</div></td>
                <td>{r.listing ? <Link href={`/admin/annonces/${r.listing.id}`}>{r.listing.pseudo}</Link> : "—"}</td>
                <td><Badge value={r.status} labels={REPORT_STATUS} /></td>
                <td className="small muted">{dateTime(r.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}

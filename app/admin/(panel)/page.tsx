import Link from "next/link";
import { db } from "@/lib/db";
import { chf, date, pct } from "@/lib/format";
import { globalTotals, totalsByListing } from "@/lib/stats";
import { Notice } from "@/components/ui";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const sp = await searchParams;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const in30 = new Date(Date.now() + 30 * 86400000);
  const [published, pending, toVerify, openReports, urgentReports, activeSubs, unpaid, revenue, expiring, shoots, totals, byListing] =
    await Promise.all([
      db.listing.count({ where: { status: "PUBLISHED" } }),
      db.listing.count({ where: { status: "PENDING_REVIEW" } }),
      db.identityVerification.count({ where: { status: "PENDING" } }),
      db.report.count({ where: { status: { not: "CLOSED" } } }),
      db.report.count({ where: { status: { not: "CLOSED" }, reason: { in: ["TRAFFICKING", "MINOR"] } } }),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.invoice.aggregate({ where: { status: "SENT" }, _sum: { amountCents: true }, _count: true }),
      db.invoice.aggregate({ where: { status: "PAID", paidAt: { gte: monthStart } }, _sum: { amountCents: true } }),
      db.subscription.findMany({
        where: { status: "ACTIVE", endDate: { lte: in30 } }, orderBy: { endDate: "asc" }, take: 5,
        include: { account: { include: { listing: true } } },
      }),
      db.subscription.count({ where: { photoShootStatus: { in: ["TO_SCHEDULE", "SCHEDULED"] } } }),
      globalTotals(30),
      totalsByListing(30),
    ]);
  const listings = await db.listing.findMany({ where: { id: { in: [...byListing.keys()] } }, select: { id: true, pseudo: true, city: true } });
  const top = listings
    .map((l) => ({ ...l, ...byListing.get(l.id)! }))
    .sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <>
      <div className="page-head"><h1>Tableau de bord</h1></div>
      <Notice sp={sp} />
      {urgentReports > 0 && (
        <div className="notice bad">
          {urgentReports} signalement(s) urgent(s) (traite, contrainte ou minorité) à traiter en priorité.{" "}
          <Link href="/admin/signalements">Voir</Link>
        </div>
      )}
      <div className="grid kpis" style={{ marginBottom: 16 }}>
        <Kpi label="Annonces publiées" value={published} href="/admin/annonces?statut=PUBLISHED" />
        <Kpi label="À modérer" value={pending} href="/admin/annonces?statut=PENDING_REVIEW" />
        <Kpi label="Identités à vérifier" value={toVerify} href="/admin/comptes?statut=PENDING_VERIFICATION" />
        <Kpi label="Signalements ouverts" value={openReports} href="/admin/signalements" />
        <Kpi label="Abonnements actifs" value={activeSubs} href="/admin/abonnements?statut=ACTIVE" />
        <Kpi label="Séances photo à faire" value={shoots} href="/admin/abonnements?photo=1" />
        <Kpi label={`Impayé (${unpaid._count})`} value={chf(unpaid._sum.amountCents ?? 0)} href="/admin/factures?statut=SENT" />
        <Kpi label="Encaissé ce mois" value={chf(revenue._sum.amountCents ?? 0)} href="/admin/factures?statut=PAID" />
      </div>

      <div className="grid two">
        <section className="card">
          <h2>30 derniers jours</h2>
          <dl className="meta">
            <dt>Vues d'annonces</dt><dd>{totals.views}</dd>
            <dt>Clics téléphone</dt><dd>{totals.phone} <span className="muted small">({pct(totals.phone, totals.views)})</span></dd>
            <dt>Clics WhatsApp</dt><dd>{totals.whatsapp} <span className="muted small">({pct(totals.whatsapp, totals.views)})</span></dd>
            <dt>Affichages en recherche</dt><dd>{totals.impressions}</dd>
          </dl>
          <h3 style={{ marginTop: 16 }}>Annonces les plus vues</h3>
          {top.length === 0 ? <p className="muted">Pas encore de données.</p> : (
            <table><tbody>
              {top.map((t) => (
                <tr key={t.id}>
                  <td><Link href={`/admin/statistiques/${t.id}`}>{t.pseudo}</Link> <span className="muted small">{t.city}</span></td>
                  <td className="num">{t.views} vues</td>
                  <td className="num">{t.phone + t.whatsapp} contacts</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </section>
        <section className="card">
          <h2>Abonnements qui expirent bientôt</h2>
          {expiring.length === 0 ? <p className="muted">Aucun dans les 30 prochains jours.</p> : (
            <table><tbody>
              {expiring.map((s) => (
                <tr key={s.id}>
                  <td><Link href={`/admin/abonnements/${s.id}`}>{s.account.listing?.pseudo ?? s.account.email}</Link><br /><span className="muted small">{s.label}</span></td>
                  <td className="num">{date(s.endDate)}</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </section>
      </div>
    </>
  );
}

function Kpi({ label, value, href }: { label: string; value: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="kpi" style={{ textDecoration: "none" }}>
      <div className="label">{label}</div>
      <div className="value" style={{ color: "var(--ink)" }}>{value}</div>
    </Link>
  );
}

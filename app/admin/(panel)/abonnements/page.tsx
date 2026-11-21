import Link from "next/link";
import type { Prisma, SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { SHOOT_STATUS, SUB_STATUS } from "@/lib/constants";
import { chf, date } from "@/lib/format";
import { Badge, Empty, Filters } from "@/components/ui";

export default async function Subscriptions({ searchParams }: { searchParams: Promise<{ statut?: string; photo?: string }> }) {
  const sp = await searchParams;
  const where: Prisma.SubscriptionWhereInput = {};
  if (sp.statut) where.status = sp.statut as SubscriptionStatus;
  if (sp.photo) where.photoShootStatus = { in: ["TO_SCHEDULE", "SCHEDULED"] };
  const [subs, plans] = await Promise.all([
    db.subscription.findMany({ where, orderBy: { createdAt: "desc" }, take: 300, include: { plan: true, account: { include: { listing: true } } } }),
    db.plan.findMany({ where: { active: true }, include: { _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } } } }),
  ]);
  return (
    <>
      <div className="page-head">
        <h1>Abonnements</h1>
        <div className="actions">
          <Link href="/admin/abonnements/formules" className="btn">Gérer les formules</Link>
          <Link href="/admin/abonnements/nouveau" className="btn primary">+ Attribuer un abonnement</Link>
        </div>
      </div>
      <p className="muted small">L'annonce de base reste gratuite. Les abonnements sont des services optionnels (photos, mise en avant).</p>
      <div className="grid kpis" style={{ marginBottom: 16 }}>
        {plans.map((p) => (
          <div key={p.id} className="kpi"><div className="label">{p.name}</div><div className="value">{p._count.subscriptions}</div><div className="small muted">actifs · {p.type === "CUSTOM" ? "prix libre" : chf(p.priceCents)}</div></div>
        ))}
      </div>
      <Filters base="/admin/abonnements" current={sp.statut} options={SUB_STATUS} />
      <div className="filters" style={{ marginTop: -6 }}><Link href="/admin/abonnements?photo=1" className={sp.photo ? "on" : ""}>Séances photo à faire</Link></div>
      <div className="table-wrap">
        {subs.length === 0 ? <Empty>Aucun abonnement.</Empty> : (
          <table>
            <thead><tr><th>Annonceuse</th><th>Formule</th><th>Statut</th><th className="num">Prix</th><th>Période</th><th>Séance photo</th></tr></thead>
            <tbody>{subs.map((s) => (
              <tr key={s.id}>
                <td><Link href={`/admin/abonnements/${s.id}`}>{s.account.listing?.pseudo ?? s.account.email}</Link></td>
                <td>{s.label}</td>
                <td><Badge value={s.status} labels={SUB_STATUS} /></td>
                <td className="num">{s.priceCents ? chf(s.priceCents) : "Offert"}</td>
                <td className="small">{date(s.startDate)} → {date(s.endDate)}</td>
                <td>{s.photoShootStatus !== "NONE" ? <Badge value={s.photoShootStatus} labels={SHOOT_STATUS} /> : "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { CANTONS, LISTING_STATUS } from "@/lib/constants";
import { pct } from "@/lib/format";
import { globalTotals, totalsByListing } from "@/lib/stats";
import { Badge } from "@/components/ui";

const PERIODS = [7, 30, 90, 365];
const SORTS: Record<string, string> = { views: "Vues", contacts: "Contacts", phone: "Téléphone", whatsapp: "WhatsApp", rate: "Taux de contact" };

export default async function Stats({ searchParams }: { searchParams: Promise<{ jours?: string; tri?: string }> }) {
  const sp = await searchParams;
  const days = PERIODS.includes(Number(sp.jours)) ? Number(sp.jours) : 30;
  const tri = sp.tri && SORTS[sp.tri] ? sp.tri : "views";
  const [map, totals, listings] = await Promise.all([
    totalsByListing(days), globalTotals(days),
    db.listing.findMany({ select: { id: true, pseudo: true, city: true, canton: true, status: true, highlighted: true } }),
  ]);
  const rows = listings.map((l) => {
    const t = map.get(l.id) ?? { views: 0, phone: 0, whatsapp: 0, impressions: 0 };
    return { ...l, ...t, contacts: t.phone + t.whatsapp, rate: t.views ? (t.phone + t.whatsapp) / t.views : 0 };
  }).sort((a, b) => (b[tri as keyof typeof b] as number) - (a[tri as keyof typeof a] as number));
  const q = (o: Record<string, string | number>) => `/admin/statistiques?${new URLSearchParams({ jours: String(days), tri, ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])) })}`;

  return (
    <>
      <div className="page-head"><h1>Statistiques</h1></div>
      <div className="filters">{PERIODS.map((p) => <Link key={p} href={q({ jours: p })} className={p === days ? "on" : ""}>{p} jours</Link>)}</div>
      <div className="grid kpis" style={{ marginBottom: 16 }}>
        <div className="kpi"><div className="label">Vues</div><div className="value">{totals.views}</div></div>
        <div className="kpi"><div className="label">Clics téléphone</div><div className="value">{totals.phone}</div></div>
        <div className="kpi"><div className="label">Clics WhatsApp</div><div className="value">{totals.whatsapp}</div></div>
        <div className="kpi"><div className="label">Taux de contact</div><div className="value">{pct(totals.phone + totals.whatsapp, totals.views)}</div></div>
      </div>
      <div className="filters"><span className="muted small" style={{ alignSelf: "center" }}>Trier par</span>{Object.entries(SORTS).map(([k, v]) => <Link key={k} href={q({ tri: k })} className={k === tri ? "on" : ""}>{v}</Link>)}</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Annonce</th><th>Statut</th><th className="num">Affichages</th><th className="num">Vues</th><th className="num">Téléphone</th><th className="num">WhatsApp</th><th className="num">Taux</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/admin/statistiques/${r.id}?jours=${days}`}>{r.pseudo}</Link> <span className="muted small">{r.city}, {CANTONS[r.canton]}</span></td>
              <td><Badge value={r.status} labels={LISTING_STATUS} /></td>
              <td className="num">{r.impressions}</td><td className="num">{r.views}</td><td className="num">{r.phone}</td><td className="num">{r.whatsapp}</td>
              <td className="num">{pct(r.contacts, r.views)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="muted small" style={{ marginTop: 10 }}>Statistiques anonymes agrégées par jour : aucune adresse IP ni identifiant de visiteur n'est conservé.</p>
    </>
  );
}

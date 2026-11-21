import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { pct } from "@/lib/format";
import { dayRange, sinceKey } from "@/lib/stats";
import { BarChart } from "@/components/BarChart";

export default async function ListingStats({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ jours?: string }> }) {
  const { id } = await params;
  const days = [7, 30, 90, 365].includes(Number((await searchParams).jours)) ? Number((await searchParams).jours) : 30;
  const l = await db.listing.findUnique({ where: { id } });
  if (!l) notFound();
  const rows = await db.listingStatDaily.findMany({ where: { listingId: id, day: { gte: sinceKey(days) } } });
  const by = new Map(rows.map((r) => [r.day, r]));
  const range = dayRange(days);
  const series = (k: "views" | "phoneClicks" | "whatsappClicks") => range.map((d) => ({ day: d, value: by.get(d)?.[k] ?? 0 }));
  const sum = (k: "views" | "phoneClicks" | "whatsappClicks" | "impressions") => rows.reduce((t, r) => t + r[k], 0);
  const v = sum("views"), p = sum("phoneClicks"), w = sum("whatsappClicks");
  return (
    <>
      <div className="page-head">
        <h1>Statistiques · {l.pseudo}</h1>
        <Link className="btn" href={`/admin/annonces/${id}`}>Voir l'annonce</Link>
      </div>
      <div className="filters">{[7, 30, 90, 365].map((d) => <Link key={d} href={`/admin/statistiques/${id}?jours=${d}`} className={d === days ? "on" : ""}>{d} jours</Link>)}</div>
      <div className="grid kpis" style={{ marginBottom: 16 }}>
        <div className="kpi"><div className="label">Affichages en recherche</div><div className="value">{sum("impressions")}</div></div>
        <div className="kpi"><div className="label">Vues de la fiche</div><div className="value">{v}</div><div className="small muted">{pct(v, sum("impressions"))} des affichages</div></div>
        <div className="kpi"><div className="label">Clics téléphone</div><div className="value">{p}</div><div className="small muted">{pct(p, v)} des vues</div></div>
        <div className="kpi"><div className="label">Clics WhatsApp</div><div className="value">{w}</div><div className="small muted">{pct(w, v)} des vues</div></div>
      </div>
      <section className="card"><h2>Vues par jour</h2><BarChart data={series("views")} label="Vues par jour" /></section>
      <div className="grid two">
        <section className="card"><h2>Clics téléphone</h2><BarChart data={series("phoneClicks")} label="Clics téléphone par jour" /></section>
        <section className="card"><h2>Clics WhatsApp</h2><BarChart data={series("whatsappClicks")} label="Clics WhatsApp par jour" /></section>
      </div>
    </>
  );
}

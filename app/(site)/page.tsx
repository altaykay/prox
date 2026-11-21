import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { CANTONS, LANGUAGES } from "@/lib/constants";
import { countImpressions, publicListingInclude } from "@/lib/public";
import { expireSubscriptions } from "@/lib/subscriptions";
import { ListingCard } from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ canton?: string; ville?: string; langue?: string }> }) {
  const sp = await searchParams;
  await expireSubscriptions();
  const where: Prisma.ListingWhereInput = { status: "PUBLISHED", account: { status: "VERIFIED" } };
  if (sp.canton && CANTONS[sp.canton]) where.canton = sp.canton;
  if (sp.ville) where.city = { contains: sp.ville.trim() };
  if (sp.langue && LANGUAGES[sp.langue]) where.languages = { contains: sp.langue };
  const searching = !!(sp.canton || sp.ville || sp.langue);

  const listings = await db.listing.findMany({
    where, include: publicListingInclude, orderBy: [{ highlighted: "desc" }, { publishedAt: "desc" }], take: 60,
  });
  const cities = await db.listing.findMany({ where: { status: "PUBLISHED", ...(sp.canton ? { canton: sp.canton } : {}) }, distinct: ["city"], select: { city: true }, orderBy: { city: "asc" } });
  await countImpressions(listings.map((l) => l.id));

  return (
    <>
      <section className="hero">
        <h1>Massages en Suisse, en toute discrétion</h1>
        <p className="muted" style={{ margin: 0 }}>Masseuses indépendantes et majeures, identité vérifiée avant chaque publication.</p>
      </section>
      <form className="search" role="search">
        <select name="canton" defaultValue={sp.canton ?? ""} aria-label="Canton">
          <option value="">Tous les cantons</option>
          {Object.entries(CANTONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input name="ville" list="villes" defaultValue={sp.ville ?? ""} placeholder="Ville" aria-label="Ville" />
        <datalist id="villes">{cities.map((c) => <option key={c.city} value={c.city} />)}</datalist>
        <select name="langue" defaultValue={sp.langue ?? ""} aria-label="Langue" className="full">
          <option value="">Toutes les langues</option>
          {Object.entries(LANGUAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn primary full" style={{ justifyContent: "center" }}>Rechercher</button>
      </form>

      <div className="section-title">
        <h2 style={{ margin: 0 }}>{searching ? `${listings.length} annonce${listings.length > 1 ? "s" : ""}` : "Annonces récentes"}</h2>
        {searching && <a href="/" className="small">Effacer les filtres</a>}
      </div>
      {listings.length === 0 ? (
        <div className="card empty">Aucune annonce ne correspond à cette recherche pour le moment.</div>
      ) : (
        <div className="cards">{listings.map((l) => <ListingCard key={l.id} l={l} />)}</div>
      )}
    </>
  );
}

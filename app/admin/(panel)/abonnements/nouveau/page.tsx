import Link from "next/link";
import { db } from "@/lib/db";
import { PLAN_TYPE } from "@/lib/constants";
import { chf, dayKey } from "@/lib/format";
import { createSubscription } from "../../../actions";

export default async function NewSubscription({ searchParams }: { searchParams: Promise<{ compte?: string }> }) {
  const { compte } = await searchParams;
  const [accounts, plans] = await Promise.all([
    db.account.findMany({ orderBy: { createdAt: "desc" }, include: { listing: true } }),
    db.plan.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } }),
  ]);
  return (
    <>
      <div className="page-head"><h1>Attribuer un abonnement</h1></div>
      {plans.length === 0 ? <div className="notice warn">Aucune formule active. <Link href="/admin/abonnements/formules">Créer une formule</Link></div> : (
        <form action={createSubscription} className="card stack">
          <div className="fields cols-2">
            <label>Annonceuse
              <select name="accountId" required defaultValue={compte ?? ""}>
                <option value="" disabled>Choisir…</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.listing?.pseudo ? `${a.listing.pseudo} — ${a.email}` : a.email}</option>)}
              </select>
            </label>
            <label>Formule
              <select name="planId" required>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.type === "CUSTOM" ? "prix libre" : `${chf(p.priceCents)} / ${p.durationMonths} mois`} ({PLAN_TYPE[p.type]})</option>)}
              </select>
            </label>
          </div>
          <p className="muted small">Pour une formule « sur mesure », indiquez le prix et la durée ci-dessous. Pour les autres, laissez vide pour garder le prix de la formule (ou saisissez un prix spécial). Un prix de 0 = abonnement offert.</p>
          <div className="fields cols-3">
            <label>Nom affiché (facultatif)<input name="label" placeholder="ex. Offre de lancement" /></label>
            <label>Prix (CHF)<input name="price" inputMode="decimal" placeholder="prix de la formule" /></label>
            <label>Durée (mois, sur mesure)<input name="durationMonths" type="number" min={1} /></label>
            <label>Début<input name="startDate" type="date" defaultValue={dayKey()} /></label>
          </div>
          <label>Notes internes<textarea name="notes" /></label>
          <div className="actions">
            <label className="check"><input type="checkbox" name="createInvoice" defaultChecked /> Émettre la facture tout de suite</label>
            <label className="check"><input type="checkbox" name="activateNow" /> Activer sans attendre le paiement</label>
          </div>
          <div className="actions"><button className="btn primary">Créer l'abonnement</button></div>
        </form>
      )}
    </>
  );
}

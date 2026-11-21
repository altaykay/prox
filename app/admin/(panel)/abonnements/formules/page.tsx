import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";
import { PLAN_TYPE } from "@/lib/constants";
import { chf } from "@/lib/format";
import { Notice } from "@/components/ui";
import { savePlan } from "../../../actions";

export default async function Plans({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const sp = await searchParams;
  const plans = await db.plan.findMany({ orderBy: [{ active: "desc" }, { createdAt: "asc" }] });
  return (
    <>
      <div className="page-head"><h1>Formules d'abonnement</h1></div>
      <Notice sp={sp} />
      {plans.map((p) => (
        <details key={p.id} className="card">
          <summary style={{ cursor: "pointer" }}>
            <strong>{p.name}</strong> · {PLAN_TYPE[p.type]} · {p.type === "CUSTOM" ? "prix libre" : chf(p.priceCents)} / {p.durationMonths} mois {!p.active && <span className="badge">Inactive</span>}
          </summary>
          <PlanForm p={p} />
        </details>
      ))}
      <section className="card"><h2>Nouvelle formule</h2><PlanForm /></section>
    </>
  );
}

function PlanForm({ p }: { p?: Plan }) {
  return (
    <form action={savePlan} className="stack" style={{ marginTop: 12 }}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="fields cols-3">
        <label>Nom<input name="name" required defaultValue={p?.name} /></label>
        <label>Type
          <select name="type" defaultValue={p?.type ?? "ANNUAL"}>
            {Object.entries(PLAN_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Prix (CHF)<input name="price" inputMode="decimal" defaultValue={p ? (p.priceCents / 100).toFixed(2) : ""} /></label>
        <label>Durée (mois)<input name="durationMonths" type="number" min={1} defaultValue={p?.durationMonths ?? 12} /></label>
      </div>
      <label>Description<textarea name="description" defaultValue={p?.description} /></label>
      <div className="actions">
        <label className="check"><input type="checkbox" name="includesPhotoShoot" defaultChecked={p?.includesPhotoShoot} /> Inclut une séance photo par l'équipe</label>
        <label className="check"><input type="checkbox" name="highlight" defaultChecked={p?.highlight} /> Met l'annonce en avant</label>
        <label className="check"><input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> Active</label>
      </div>
      <div className="actions"><button className="btn primary">{p ? "Enregistrer" : "Créer la formule"}</button></div>
    </form>
  );
}

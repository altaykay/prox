import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings, SETTINGS_GROUPS } from "@/lib/settings";
import { Notice } from "@/components/ui";
import { addDemoData, removeDemoData, saveSettings } from "../../actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin({ role: "ADMIN" });
  const sp = await searchParams;
  const [s, stored, demo] = await Promise.all([
    getSettings(),
    db.setting.findMany().then((r) => Object.fromEntries(r.map((x) => [x.key, x.value]))),
    db.account.count({ where: { isDemo: true } }),
  ]);
  return (
    <>
      <div className="page-head"><h1>Paramètres du site</h1></div>
      <Notice sp={sp} />
      <form action={saveSettings} className="stack">
        {SETTINGS_GROUPS.map((g) => (
          <section key={g.title} className="card">
            <h2>{g.title}</h2>
            {g.intro && <p className="muted small">{g.intro}</p>}
            <div className="stack">
              {Object.entries(g.fields).map(([key, f]) => {
                const value = f.type === "long" ? stored[key] ?? "" : s[key];
                return (
                  <label key={key}>
                    {f.label}
                    {f.type === "long" || f.type === "textarea"
                      ? <textarea name={key} defaultValue={value} rows={f.type === "long" ? 12 : 3} placeholder={f.type === "long" ? "Vide = texte par défaut du site" : undefined} />
                      : <input name={key} defaultValue={value} />}
                    {f.help && <span className="small muted">{f.help}</span>}
                  </label>
                );
              })}
            </div>
          </section>
        ))}
        <div className="actions"><button className="btn primary">Enregistrer les paramètres</button></div>
      </form>

      <section className="card" id="exemples" style={{ marginTop: 16 }}>
        <h2>Annonces d'exemple</h2>
        <p className="muted small">
          12 annonces fictives avec photos d'ambiance (sans personne), comptes, statistiques, abonnements, factures, un message et un signalement,
          pour présenter le site. Elles portent la mention « Exemple » et leurs boutons de contact sont désactivés.
          Supprimez-les avant l'ouverture au public. Comptes d'exemple : prénom.demo@exemple.ch / demo-annonceuse.
        </p>
        <p><strong>{demo ? `${demo} comptes d'exemple en place.` : "Aucune donnée d'exemple."}</strong></p>
        <div className="actions">
          {!demo && <form action={addDemoData}><button className="btn primary">Ajouter les exemples</button></form>}
          {demo > 0 && <form action={removeDemoData}><button className="btn danger">Supprimer tous les exemples</button></form>}
        </div>
      </section>
    </>
  );
}

import { getSettings } from "@/lib/settings";
import { RichText } from "@/components/RichText";

export const metadata = { title: "Mentions légales" };
export const dynamic = "force-dynamic";

export default async function Imprint() {
  const s = await getSettings();
  const v = (x: string) => x || <span className="muted">à compléter dans l'administration (Paramètres)</span>;
  return (
    <div className="prose">
      <h1>Mentions légales</h1>
      <dl className="meta">
        <dt>Éditeur</dt><dd>{v(s.issuerName)}</dd>
        <dt>Adresse</dt><dd style={{ whiteSpace: "pre-line" }}>{v(s.issuerAddress)}</dd>
        <dt>IDE</dt><dd>{v(s.issuerIde)}</dd>
        <dt>Contact</dt><dd>{v(s.contactEmail)}</dd>
        <dt>Responsable</dt><dd>{v(s.issuerManager)}</dd>
        <dt>Site</dt><dd>{s.siteDomain || s.siteName}</dd>
        <dt>Hébergement</dt><dd>{v(s.hostingProvider)}</dd>
      </dl>
      {s.pageMentions.trim() ? <RichText text={s.pageMentions} /> : (
        <>
          <h2>Responsabilité</h2>
          <p>{s.siteName} publie des annonces d'annonceuses indépendantes, vérifiées et modérées avant publication. {s.siteName} ne fournit aucune prestation de massage et ne perçoit aucune commission.</p>
        </>
      )}
    </div>
  );
}

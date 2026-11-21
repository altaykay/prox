export const metadata = { title: "Mentions légales – Prox" };
export default function Imprint() {
  return (
    <div className="prose">
      <h1>Mentions légales</h1>
      <p className="notice warn">À compléter avec les informations de l'entreprise.</p>
      <dl className="meta">
        <dt>Éditeur</dt><dd>[Raison sociale]</dd>
        <dt>Adresse</dt><dd>[Rue, NPA, localité, Suisse]</dd>
        <dt>IDE</dt><dd>[CHE-xxx.xxx.xxx]</dd>
        <dt>Contact</dt><dd>[e-mail]</dd>
        <dt>Responsable</dt><dd>[Nom]</dd>
        <dt>Hébergement</dt><dd>[Hébergeur en Suisse acceptant les contenus pour adultes]</dd>
      </dl>
      <h2>Responsabilité</h2>
      <p>Prox publie des annonces d'annonceuses indépendantes, vérifiées et modérées avant publication. Prox ne fournit aucune prestation de massage et ne perçoit aucune commission.</p>
    </div>
  );
}

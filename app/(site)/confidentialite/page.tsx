export const metadata = { title: "Politique de confidentialité – Prox" };
export default function Privacy() {
  return (
    <div className="prose">
      <h1>Politique de confidentialité</h1>
      <p className="notice warn">Projet conforme à la structure exigée par la nLPD (art. 19 ss). À compléter et faire valider par un juriste avant la mise en ligne.</p>
      <h2>1. Responsable du traitement</h2>
      <p>[Raison sociale], [adresse], [e-mail de contact pour la protection des données].</p>
      <h2>2. Données traitées</h2>
      <ul>
        <li><strong>Visiteurs</strong> : aucune inscription. Un cookie technique mémorise la confirmation d'âge (30 jours). Les statistiques de consultation sont anonymes et agrégées par jour : pas d'adresse IP ni d'identifiant de visiteur conservé. Aucun outil de traçage publicitaire.</li>
        <li><strong>Annonceuses</strong> : e-mail, téléphone, contenu de l'annonce et photos, coordonnées de facturation en cas de service payant.</li>
        <li><strong>Vérification</strong> : pièce d'identité, selfie et, si le canton l'exige, référence d'enregistrement cantonal. Ces données peuvent révéler des informations sensibles (art. 5 let. c nLPD) et sont traitées avec des mesures renforcées.</li>
        <li><strong>Signalements</strong> : contenu du signalement et contact facultatif.</li>
      </ul>
      <h2>3. Finalités</h2>
      <p>Publication des annonces ; vérification de l'âge, de l'identité et du caractère indépendant de l'activité ; prévention de la traite, de la contrainte et de l'exploitation de mineurs ; facturation des services optionnels ; respect des obligations légales.</p>
      <h2>4. Sécurité et conservation séparée des documents</h2>
      <p>Les pièces d'identité et selfies sont chiffrés et conservés dans un espace de stockage séparé de la base des annonces, accessible uniquement à l'équipe de vérification. Chaque consultation est journalisée. Ils sont supprimés [durée à définir, p. ex. 30 jours après la fermeture du compte], sauf obligation légale ou procédure en cours.</p>
      <h2>5. Destinataires</h2>
      <p>Hébergeur en Suisse [nom à compléter]. Autorités compétentes en cas de soupçon d'infraction ou sur réquisition. Aucune vente ni cession de données.</p>
      <h2>6. Transfert à l'étranger</h2>
      <p>Les données sont hébergées en Suisse. [À adapter si un prestataire est situé à l'étranger.]</p>
      <h2>7. Durées de conservation</h2>
      <ul>
        <li>Annonce et compte : jusqu'à la suppression par l'annonceuse.</li>
        <li>Factures : 10 ans (art. 958f CO).</li>
        <li>Journal de modération : [durée à définir].</li>
      </ul>
      <h2>8. Vos droits</h2>
      <p>Droit d'accès, de rectification, d'effacement et de remise des données (art. 25 ss nLPD). L'annonceuse peut supprimer son compte elle-même depuis son espace. Contact : [e-mail]. Vous pouvez saisir le Préposé fédéral à la protection des données et à la transparence (PFPDT).</p>
    </div>
  );
}

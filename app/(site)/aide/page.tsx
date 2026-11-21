import Link from "next/link";

export const metadata = { title: "Aide et sécurité – Prox" };

export default function Help() {
  return (
    <div className="prose">
      <h1>Aide et sécurité</h1>
      <div className="notice bad"><strong>Danger immédiat : police 117.</strong> Urgences médicales : 144.</div>

      <h2>Signes possibles de traite ou de contrainte</h2>
      <ul>
        <li>La personne ne parle pas elle-même, une autre personne répond ou fixe les rendez-vous.</li>
        <li>Elle semble avoir peur, être surveillée, ne pas pouvoir partir ou ne pas garder son argent.</li>
        <li>Elle n'a pas ses papiers d'identité, ou paraît mineure.</li>
        <li>Plusieurs annonces avec le même numéro ou les mêmes photos.</li>
      </ul>
      <p>Si vous avez un doute, <Link href="/signaler">signalez l'annonce</Link>. Notre équipe la suspend et transmet aux autorités si nécessaire. Ne confrontez pas vous-même une personne qui pourrait être en danger.</p>

      <h2>Contacts</h2>
      <ul>
        <li><strong>Police</strong> : 117 (urgence) ou le poste de police de votre canton.</li>
        <li><strong>FIZ</strong> – Centre d'assistance aux migrantes et aux victimes de la traite (Zurich, toute la Suisse) : <a href="https://www.fiz-info.ch" target="_blank" rel="noopener noreferrer">fiz-info.ch</a></li>
        <li><strong>ACT212</strong> – Ligne nationale contre la traite des êtres humains : <a href="https://www.act212.ch" target="_blank" rel="noopener noreferrer">act212.ch</a></li>
        <li><strong>Aspasie</strong> (Genève) – soutien aux travailleuses et travailleurs du sexe : <a href="https://www.aspasie.ch" target="_blank" rel="noopener noreferrer">aspasie.ch</a></li>
        <li><strong>Fleur de Pavé</strong> (Lausanne) : <a href="https://www.fleurdepave.ch" target="_blank" rel="noopener noreferrer">fleurdepave.ch</a></li>
        <li><strong>Centres LAVI</strong> – aide aux victimes d'infractions, dans chaque canton : <a href="https://www.aide-aux-victimes.ch" target="_blank" rel="noopener noreferrer">aide-aux-victimes.ch</a></li>
      </ul>
      <p className="small muted">Coordonnées à vérifier régulièrement.</p>

      <h2>Pour les annonceuses</h2>
      <p>Prox est gratuit et ne prend aucune commission. Votre compte vous appartient : personne d'autre ne doit le gérer pour vous. Si quelqu'un vous y oblige, ou garde votre argent ou vos papiers, les associations ci-dessus peuvent vous aider, de façon confidentielle et gratuite.</p>
    </div>
  );
}

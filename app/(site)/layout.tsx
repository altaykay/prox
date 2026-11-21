import Link from "next/link";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="in">
          <Link href="/" className="brand">Prox</Link>
          <nav>
            <Link href="/espace">Espace annonceuse</Link>
            <Link href="/aide">Aide &amp; sécurité</Link>
          </nav>
        </div>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="in">
          <nav>
            <Link href="/aide">Aide &amp; sécurité</Link>
            <Link href="/signaler">Signaler un abus</Link>
            <Link href="/cgu">Conditions d'utilisation</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
          </nav>
          <p style={{ margin: 0 }}>Annonces gratuites de masseuses majeures et indépendantes, vérifiées avant publication. Aucune commission sur les prestations. Réservé aux personnes de 18 ans et plus.</p>
          <p style={{ margin: 0 }}>Victime ou témoin de traite ou de contrainte ? Police : <strong>117</strong> · <Link href="/aide">contacts d'aide</Link></p>
        </div>
      </footer>
    </>
  );
}

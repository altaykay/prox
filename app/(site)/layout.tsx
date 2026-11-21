import Link from "next/link";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      <header className="site-header">
        <div className="in">
          <Link href="/" className="brand">{s.siteName}</Link>
          <nav>
            <Link href="/messages">Messages</Link>
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
          <p style={{ margin: 0, whiteSpace: "pre-line" }}>{s.footerText}</p>
          <p style={{ margin: 0 }}>Victime ou témoin de traite ou de contrainte ? Police : <strong>117</strong> · <Link href="/aide">contacts d'aide</Link></p>
        </div>
      </footer>
    </>
  );
}

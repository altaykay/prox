import Link from "next/link";
import { confirmAge } from "../site-actions";

export const metadata = { title: "Prox – accès réservé aux adultes" };

export default async function Gate({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  return (
    <div className="gate" style={{ position: "fixed", inset: 0, zIndex: 50 }}>
      <div className="box">
        <h1>Prox</h1>
        <p>Ce site contient des annonces de massages érotiques destinées exclusivement aux adultes.</p>
        <p>En entrant, vous confirmez avoir <strong>18 ans révolus</strong> et accepter les <Link href="/cgu" style={{ color: "#fff", textDecoration: "underline" }}>conditions d'utilisation</Link>.</p>
        <form action={confirmAge} style={{ display: "grid", gap: 10, marginTop: 22 }}>
          <input type="hidden" name="suite" value={suite ?? "/"} />
          <button className="btn primary">J'ai 18 ans ou plus — Entrer</button>
          <a className="btn" href="https://www.google.ch" style={{ background: "transparent", color: "#fff", borderColor: "#ffffff55" }}>Quitter</a>
        </form>
        <p className="small" style={{ marginTop: 22 }}><Link href="/aide" style={{ color: "#ffffffbf" }}>Aide &amp; sécurité</Link> · <Link href="/confidentialite" style={{ color: "#ffffffbf" }}>Confidentialité</Link></p>
      </div>
    </div>
  );
}

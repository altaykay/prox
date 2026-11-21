import Link from "next/link";
import { proLogin } from "../actions";

export default async function ProLogin({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  return (
    <div className="prose" style={{ maxWidth: 420 }}>
      <h1>Espace annonceuse</h1>
      {erreur && <div className="notice bad">Identifiants incorrects.</div>}
      <form action={proLogin} className="card stack">
        <label>E-mail<input name="email" type="email" required autoComplete="username" /></label>
        <label>Mot de passe<input name="password" type="password" required autoComplete="current-password" /></label>
        <button className="btn primary">Se connecter</button>
      </form>
      <p className="small">Pas encore de compte ? <Link href="/espace/inscription">Publier une annonce gratuite</Link></p>
    </div>
  );
}

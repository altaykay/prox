import { login } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  return (
    <main className="login">
      <div className="card">
        <h1>Prox <span className="muted small">administration</span></h1>
        {erreur && <div className="notice bad">Identifiants incorrects.</div>}
        <form action={login} className="stack">
          <label>E-mail<input name="email" type="email" required autoComplete="username" /></label>
          <label>Mot de passe<input name="password" type="password" required autoComplete="current-password" /></label>
          <button className="btn primary" type="submit">Se connecter</button>
        </form>
      </div>
    </main>
  );
}

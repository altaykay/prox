import Link from "next/link";
import { register } from "../actions";

const ERR: Record<string, string> = {
  conditions: "Vous devez confirmer chacune des conditions.", mdp: "Le mot de passe doit faire au moins 10 caractères.",
  existe: "Un compte existe déjà avec cet e-mail.",
};

export default async function Register({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  return (
    <div className="prose" style={{ maxWidth: 520 }}>
      <h1>Publier une annonce gratuite</h1>
      <p className="muted">Gratuit, sans commission. Votre identité et votre âge sont vérifiés avant toute publication.</p>
      {erreur && <div className="notice bad">{ERR[erreur]}</div>}
      <form action={register} className="card stack">
        <label>E-mail<input name="email" type="email" required autoComplete="email" /></label>
        <label>Téléphone<input name="phone" type="tel" required placeholder="+41 79 000 00 00" /></label>
        <label>Mot de passe (10 caractères min.)<input name="password" type="password" required minLength={10} autoComplete="new-password" /></label>
        <label className="check"><input type="checkbox" name="adult" required /> J'ai 18 ans révolus.</label>
        <label className="check"><input type="checkbox" name="independent" required /> J'exerce de façon indépendante, de mon plein gré, et je respecte les règles de mon canton.</label>
        <label className="check"><input type="checkbox" name="self" required /> Je crée et gère ce compte moi-même, pour moi seule.</label>
        <label className="check"><input type="checkbox" name="terms" required /> J'accepte les <Link href="/cgu" target="_blank">conditions</Link> et la <Link href="/confidentialite" target="_blank">politique de confidentialité</Link>.</label>
        <button className="btn primary">Créer mon compte</button>
      </form>
      <p className="small">Déjà inscrite ? <Link href="/espace/connexion">Se connecter</Link></p>
      <p className="small muted">Quelqu'un vous oblige à publier ou garde votre argent ? <Link href="/aide">Vous pouvez être aidée, gratuitement et en toute confidentialité.</Link></p>
    </div>
  );
}

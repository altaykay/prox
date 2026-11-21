import Link from "next/link";
import { db } from "@/lib/db";
import { saveListing } from "../../../actions";
import { ListingFields } from "@/components/ListingFields";

export default async function NewListing({ searchParams }: { searchParams: Promise<{ compte?: string }> }) {
  const { compte } = await searchParams;
  // Une annonce = une personne : seuls les comptes sans annonce sont proposés.
  const accounts = await db.account.findMany({ where: { listing: null }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <div className="page-head"><h1>Nouvelle annonce</h1></div>
      {accounts.length === 0 ? (
        <div className="notice warn">Tous les comptes ont déjà une annonce. <Link href="/admin/comptes/nouveau">Créer d'abord un compte</Link>.</div>
      ) : (
        <form action={saveListing} className="card stack">
          <label>Compte de l'annonceuse
            <select name="accountId" required defaultValue={compte ?? ""}>
              <option value="" disabled>Choisir…</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.email}</option>)}
            </select>
          </label>
          <ListingFields />
          <div className="actions"><button className="btn primary">Créer (en attente de modération)</button></div>
        </form>
      )}
    </>
  );
}

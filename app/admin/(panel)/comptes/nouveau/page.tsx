import { saveAccount } from "../../../actions";
import { AccountFields } from "@/components/AccountFields";
export default function NewAccount() {
  return (
    <>
      <div className="page-head"><h1>Nouveau compte</h1></div>
      <div className="notice warn">Un compte = une seule personne, qui gère elle-même son annonce. Pas de compte pour un tiers (agence, salon, gérant).</div>
      <form action={saveAccount} className="card stack">
        <AccountFields />
        <div className="actions"><button className="btn primary">Créer le compte</button></div>
      </form>
    </>
  );
}

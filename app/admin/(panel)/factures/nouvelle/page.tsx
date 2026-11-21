import { db } from "@/lib/db";
import { dayKey } from "@/lib/format";
import { createInvoice } from "../../../actions";

export default async function NewInvoice({ searchParams }: { searchParams: Promise<{ compte?: string; abonnement?: string }> }) {
  const sp = await searchParams;
  const accounts = await db.account.findMany({ orderBy: { createdAt: "desc" }, include: { listing: true } });
  return (
    <>
      <div className="page-head"><h1>Nouvelle facture</h1></div>
      <form action={createInvoice} className="card stack">
        {sp.abonnement && <input type="hidden" name="subscriptionId" value={sp.abonnement} />}
        <label>Client
          <select name="accountId" required defaultValue={sp.compte ?? ""}>
            <option value="" disabled>Choisir…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.listing?.pseudo ? `${a.listing.pseudo} — ${a.email}` : a.email}</option>)}
          </select>
        </label>
        <label>Objet<input name="label" required placeholder="ex. Séance photo supplémentaire" /></label>
        <div className="fields cols-3">
          <label>Montant HT (CHF)<input name="amount" required inputMode="decimal" /></label>
          <label>TVA (%)<input name="vatRate" inputMode="decimal" defaultValue={(Number(process.env.VAT_RATE_BP ?? 0) / 100).toString()} /></label>
          <label>Échéance<input name="dueDate" type="date" defaultValue={dayKey(new Date(Date.now() + 30 * 86400000))} /></label>
        </div>
        <label>Notes (visibles sur la facture)<textarea name="notes" /></label>
        <div className="actions"><button className="btn primary">Émettre la facture</button></div>
      </form>
    </>
  );
}

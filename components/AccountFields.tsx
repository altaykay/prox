import type { Account } from "@prisma/client";
export function AccountFields({ a }: { a?: Partial<Account> }) {
  return (
    <>
      <div className="fields cols-2">
        <label>E-mail<input name="email" type="email" required defaultValue={a?.email} /></label>
        <label>Téléphone<input name="phone" type="tel" required defaultValue={a?.phone} /></label>
      </div>
      <h3 style={{ margin: "6px 0 0" }}>Facturation <span className="muted small">(seulement pour les abonnements)</span></h3>
      <div className="fields cols-2">
        <label>Nom pour la facture<input name="billingName" defaultValue={a?.billingName ?? ""} /></label>
        <label>Adresse<input name="billingAddress" defaultValue={a?.billingAddress ?? ""} /></label>
        <label>NPA<input name="billingZip" defaultValue={a?.billingZip ?? ""} /></label>
        <label>Localité<input name="billingCity" defaultValue={a?.billingCity ?? ""} /></label>
      </div>
    </>
  );
}

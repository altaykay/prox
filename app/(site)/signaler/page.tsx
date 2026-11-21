import Link from "next/link";
import { db } from "@/lib/db";
import { REPORT_REASON } from "@/lib/constants";
import { submitReport } from "../site-actions";

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ annonce?: string; merci?: string; erreur?: string }> }) {
  const sp = await searchParams;
  const listing = sp.annonce ? await db.listing.findUnique({ where: { id: sp.annonce }, select: { id: true, pseudo: true } }) : null;
  if (sp.merci) return (
    <div className="prose card">
      <h1>Merci</h1>
      <p>Votre signalement a été transmis à notre équipe de modération, qui le traite en priorité.</p>
      <p>Si une personne est en danger immédiat, appelez la police au <strong>117</strong>.</p>
      <Link href="/aide">Contacts d'aide</Link>
    </div>
  );
  return (
    <div className="prose">
      <h1>Signaler {listing ? <>l'annonce de {listing.pseudo}</> : "un abus"}</h1>
      <div className="notice bad">Danger immédiat : appelez la police au <strong>117</strong>. Pour un soupçon de traite ou de contrainte, voir aussi les <Link href="/aide">services spécialisés</Link>.</div>
      {sp.erreur && <div className="notice bad">Choisissez un motif et décrivez la situation.</div>}
      <form action={submitReport} className="card stack">
        {listing && <input type="hidden" name="listingId" value={listing.id} />}
        <label>Motif
          <select name="reason" required defaultValue="">
            <option value="" disabled>Choisir…</option>
            {Object.entries(REPORT_REASON).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Ce que vous avez constaté<textarea name="message" required minLength={5} maxLength={5000} /></label>
        <label>Moyen de vous recontacter (facultatif)<input name="contact" placeholder="E-mail ou téléphone" /></label>
        <p className="small muted" style={{ margin: 0 }}>Le signalement peut être anonyme. Nous n'enregistrons pas votre adresse IP.</p>
        <button className="btn primary">Envoyer le signalement</button>
      </form>
    </div>
  );
}

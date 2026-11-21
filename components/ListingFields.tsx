import type { Listing } from "@prisma/client";
import { CANTONS, LANGUAGES } from "@/lib/constants";

export function ListingFields({ l }: { l?: Partial<Listing> }) {
  const langs = (l?.languages ?? "").split(",");
  return (
    <>
      <div className="fields cols-2">
        <label>Prénom ou pseudo<input name="pseudo" required maxLength={40} defaultValue={l?.pseudo} /></label>
        <label>Téléphone<input name="phone" required type="tel" placeholder="+41 79 000 00 00" defaultValue={l?.phone} /></label>
        <label>Canton
          <select name="canton" required defaultValue={l?.canton ?? ""}>
            <option value="" disabled>Choisir…</option>
            {Object.entries(CANTONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Ville<input name="city" required defaultValue={l?.city} /></label>
      </div>
      <label className="check"><input type="checkbox" name="whatsapp" defaultChecked={l?.whatsapp ?? true} /> Joignable sur WhatsApp</label>
      <label>Description<textarea name="description" required maxLength={3000} defaultValue={l?.description} /></label>
      <label>Prestations proposées <span className="small">(séparées par des virgules)</span>
        <input name="services" defaultValue={l?.services} placeholder="Massage relaxant, massage tantrique, …" />
      </label>
      <div className="fields cols-2">
        <label>Tarifs<textarea name="rates" defaultValue={l?.rates} placeholder={"30 min : 120 CHF\n1 h : 200 CHF"} /></label>
        <label>Horaires<textarea name="hours" defaultValue={l?.hours} placeholder={"Lun–Ven 10h–20h\nSur rendez-vous"} /></label>
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="muted small" style={{ marginBottom: 6 }}>Langues parlées</legend>
        <div className="actions">
          {Object.entries(LANGUAGES).map(([k, v]) => (
            <label key={k} className="check"><input type="checkbox" name="languages" value={k} defaultChecked={langs.includes(k)} /> {v}</label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

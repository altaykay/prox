export const chf = (cents: number) =>
  new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF" }).format(cents / 100);

export const date = (d?: Date | null) =>
  d ? new Intl.DateTimeFormat("fr-CH", { dateStyle: "medium", timeZone: "Europe/Zurich" }).format(d) : "—";

export const dateTime = (d?: Date | null) =>
  d ? new Intl.DateTimeFormat("fr-CH", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Zurich" }).format(d) : "—";

export const dayKey = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" }).format(d); // AAAA-MM-JJ

export const toCents = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "0").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

export const addMonths = (d: Date, m: number) => {
  const r = new Date(d);
  r.setMonth(r.getMonth() + m);
  return r;
};

export const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)} %` : "—");

export const invoiceTotal = (amountCents: number, vatRateBp: number) =>
  amountCents + Math.round((amountCents * vatRateBp) / 10000);

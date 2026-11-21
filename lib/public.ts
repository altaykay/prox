import { db } from "./db";
import { dayKey } from "./format";

export const publicListingInclude = {
  photos: { where: { approved: true }, orderBy: { position: "asc" as const } },
  account: { select: { isDemo: true } },
};

// Comptabilise les affichages dans les résultats (une écriture groupée par page).
export async function countImpressions(ids: string[]) {
  if (!ids.length) return;
  const day = dayKey();
  await db.$transaction(ids.map((listingId) => db.listingStatDaily.upsert({
    where: { listingId_day: { listingId, day } },
    create: { listingId, day, impressions: 1 },
    update: { impressions: { increment: 1 } },
  })));
}

export function waLink(phone: string) {
  return `https://wa.me/${phone.replace(/[^\d]/g, "").replace(/^0/, "41")}`;
}
export function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

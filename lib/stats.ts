import { db } from "./db";
import { dayKey } from "./format";

export function sinceKey(days: number) {
  return dayKey(new Date(Date.now() - (days - 1) * 86400000));
}

export async function totalsByListing(days: number) {
  const rows = await db.listingStatDaily.groupBy({
    by: ["listingId"], where: { day: { gte: sinceKey(days) } },
    _sum: { views: true, phoneClicks: true, whatsappClicks: true, impressions: true },
  });
  return new Map(rows.map((r) => [r.listingId, {
    views: r._sum.views ?? 0, phone: r._sum.phoneClicks ?? 0, whatsapp: r._sum.whatsappClicks ?? 0, impressions: r._sum.impressions ?? 0,
  }]));
}

export async function globalTotals(days: number) {
  const r = await db.listingStatDaily.aggregate({
    where: { day: { gte: sinceKey(days) } },
    _sum: { views: true, phoneClicks: true, whatsappClicks: true, impressions: true },
  });
  return { views: r._sum.views ?? 0, phone: r._sum.phoneClicks ?? 0, whatsapp: r._sum.whatsappClicks ?? 0, impressions: r._sum.impressions ?? 0 };
}

export function dayRange(days: number) {
  return Array.from({ length: days }, (_, i) => dayKey(new Date(Date.now() - (days - 1 - i) * 86400000)));
}

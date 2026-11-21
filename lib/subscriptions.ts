import { db } from "./db";

// Passe en « Expiré » les abonnements arrivés à échéance et met à jour la mise en avant des annonces.
export async function expireSubscriptions() {
  const now = new Date();
  const due = await db.subscription.findMany({ where: { status: "ACTIVE", endDate: { lt: now } }, select: { id: true, accountId: true } });
  if (!due.length) return;
  await db.subscription.updateMany({ where: { id: { in: due.map((d) => d.id) } }, data: { status: "EXPIRED" } });
  for (const accountId of new Set(due.map((d) => d.accountId))) {
    const still = await db.subscription.findFirst({ where: { accountId, status: "ACTIVE", endDate: { gt: now }, plan: { highlight: true } } });
    await db.listing.updateMany({ where: { accountId }, data: { highlighted: !!still } });
  }
}

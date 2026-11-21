// Initialisation : compte admin + formules. Données d'exemple avec SEED_DEMO=1 (ou depuis /admin/parametres).
// Lancer : npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createDemoData } from "../lib/demo";

const db = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@prox.local").toLowerCase();
  const admin = await db.adminUser.upsert({
    where: { email }, update: {},
    create: { email, name: "Administrateur", role: "ADMIN", passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "ChangeMoi!2026", 12) },
  });

  if ((await db.plan.count()) === 0) {
    await db.plan.createMany({ data: [
      { name: "Pack Photo Pro", type: "PHOTO", priceCents: 39000, durationMonths: 6, includesPhotoShoot: true, highlight: true,
        description: "Séance photo discrète réalisée par notre équipe (visage flouté si souhaité) + 6 mois de mise en avant." },
      { name: "Annuel", type: "ANNUAL", priceCents: 49000, durationMonths: 12, highlight: true,
        description: "12 mois de mise en avant dans les résultats, payés en une fois." },
      { name: "Sur mesure", type: "CUSTOM", priceCents: 0, durationMonths: 1,
        description: "Abonnement créé à la main par l'administration (prix et durée libres, ou offert)." },
    ] });
  }
  if (process.env.SEED_DEMO === "1") {
    const n = await createDemoData(db, admin.id);
    if (n) await db.moderationLog.create({ data: { adminId: admin.id, action: "Données d'exemple ajoutées", targetType: "system", targetId: "seed", details: `${n} comptes` } });
  }
  console.log("OK — admin :", email);
}
main().finally(() => db.$disconnect());

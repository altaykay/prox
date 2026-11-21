// Initialisation : compte admin + formules. Données de démonstration seulement avec SEED_DEMO=1.
// Lancer : npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const day = (offset: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" }).format(new Date(Date.now() - offset * 86400000));
const addMonths = (d: Date, m: number) => { const r = new Date(d); r.setMonth(r.getMonth() + m); return r; };

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
  if (process.env.SEED_DEMO !== "1") { console.log("Admin et formules prêts (pas de données de démonstration : SEED_DEMO=1 pour en ajouter)."); return; }
  if ((await db.account.count()) > 0) { console.log("Données déjà présentes : seul l'admin a été vérifié."); return; }

  const demo = [
    { pseudo: "Léa", canton: "GE", city: "Genève", languages: "fr,en", status: "PUBLISHED" },
    { pseudo: "Sofia", canton: "VD", city: "Lausanne", languages: "fr,it,es", status: "PUBLISHED" },
    { pseudo: "Nina", canton: "ZH", city: "Zürich", languages: "de,en", status: "PUBLISHED" },
    { pseudo: "Ambre", canton: "NE", city: "Neuchâtel", languages: "fr", status: "PENDING_REVIEW" },
    { pseudo: "Mila", canton: "TI", city: "Lugano", languages: "it,fr", status: "PAUSED" },
  ] as const;

  const pw = await bcrypt.hash("demo-annonceuse", 12);
  const plans = await db.plan.findMany();
  for (const [i, d] of demo.entries()) {
    const verified = d.status !== "PENDING_REVIEW";
    const acc = await db.account.create({
      data: {
        email: `${d.pseudo.toLowerCase()}@exemple.ch`, phone: `+41 79 555 0${i}${i} ${i}${i}`, passwordHash: pw,
        status: verified ? "VERIFIED" : "PENDING_VERIFICATION", billingName: `${d.pseudo} (démo)`, billingCity: d.city,
        verification: { create: { status: verified ? "APPROVED" : "PENDING", ageConfirmed: verified, reviewedById: verified ? admin.id : null, reviewedAt: verified ? new Date() : null } },
        listing: { create: {
          pseudo: d.pseudo, phone: `+41 79 555 0${i}${i} ${i}${i}`, canton: d.canton, city: d.city, languages: d.languages, status: d.status,
          publishedAt: d.status === "PUBLISHED" ? new Date(Date.now() - (i + 2) * 86400000) : null,
          description: "Masseuse indépendante, je vous accueille dans un cadre calme, propre et discret. Massages relaxants aux huiles chaudes, sur rendez-vous uniquement.",
          services: "Massage relaxant, Massage aux huiles chaudes, Massage tantrique", rates: "30 min : 120 CHF\n1 h : 200 CHF", hours: "Lun–Ven 10h–20h\nSam sur rendez-vous",
        } },
      },
      include: { listing: true },
    });
    if (d.status !== "PENDING_REVIEW") {
      for (let k = 0; k < 60; k++) {
        const views = Math.round((20 + Math.random() * 40) * (1 - i * 0.15));
        await db.listingStatDaily.create({ data: {
          listingId: acc.listing!.id, day: day(k), views, impressions: views * 4 + Math.round(Math.random() * 30),
          phoneClicks: Math.round(views * (0.05 + Math.random() * 0.06)), whatsappClicks: Math.round(views * (0.08 + Math.random() * 0.08)),
        } });
      }
    }
    if (i < 3) {
      const plan = plans[i];
      const start = new Date(Date.now() - (i + 1) * 40 * 86400000);
      const price = plan.type === "CUSTOM" ? 0 : plan.priceCents;
      const sub = await db.subscription.create({ data: {
        accountId: acc.id, planId: plan.id, label: plan.type === "CUSTOM" ? "Offre de lancement (offerte)" : plan.name, priceCents: price,
        status: "ACTIVE", startDate: start, endDate: addMonths(start, plan.type === "CUSTOM" ? 3 : plan.durationMonths),
        photoShootStatus: plan.includesPhotoShoot ? "SCHEDULED" : "NONE", createdById: admin.id,
      } });
      if (price) {
        await db.invoice.create({ data: {
          number: `PRX-${new Date().getFullYear()}-000${i + 1}`, accountId: acc.id, subscriptionId: sub.id, label: `${plan.name} (${plan.durationMonths} mois)`,
          amountCents: price, status: i === 0 ? "PAID" : "SENT", issueDate: start, dueDate: new Date(start.getTime() + 30 * 86400000),
          paidAt: i === 0 ? new Date(start.getTime() + 5 * 86400000) : null, paymentMethod: i === 0 ? "Virement bancaire" : null,
          billingName: `${d.pseudo} (démo)`, billingAddress: d.city,
        } });
      }
      if (plan.highlight) await db.listing.update({ where: { id: acc.listing!.id }, data: { highlighted: true } });
    }
    if (i === 2) {
      await db.report.create({ data: { listingId: acc.listing!.id, reason: "FAKE", message: "Le numéro ne semble pas correspondre (exemple de démonstration)." } });
    }
  }
  await db.moderationLog.create({ data: { adminId: admin.id, action: "Données de démonstration créées", targetType: "system", targetId: "seed" } });
  console.log("OK — admin :", email);
}

main().finally(() => db.$disconnect());

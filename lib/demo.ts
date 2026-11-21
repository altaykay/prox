// Données d'exemple : annonces fictives (photos d'ambiance, sans personne), comptes, statistiques,
// abonnements et factures. Tout est marqué isDemo et se supprime en un clic depuis /admin/parametres.
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const DEMO = [
  { pseudo: "Léa", canton: "GE", city: "Genève", languages: "fr,en", services: "Massage relaxant, Massage aux huiles chaudes, Massage tantrique" },
  { pseudo: "Sofia", canton: "VD", city: "Lausanne", languages: "fr,it,es", services: "Massage californien, Massage aux pierres chaudes" },
  { pseudo: "Nina", canton: "ZH", city: "Zürich", languages: "de,en", services: "Massage tantrique, Massage body-body, Massage relaxant" },
  { pseudo: "Ambre", canton: "NE", city: "Neuchâtel", languages: "fr", services: "Massage relaxant, Massage aux huiles" },
  { pseudo: "Mila", canton: "TI", city: "Lugano", languages: "it,fr,de", services: "Massage aux huiles chaudes, Massage tantrique" },
  { pseudo: "Clara", canton: "BE", city: "Berne", languages: "de,fr", services: "Massage suédois, Massage relaxant" },
  { pseudo: "Inès", canton: "FR", city: "Fribourg", languages: "fr,de,pt", services: "Massage californien, Massage aux huiles chaudes" },
  { pseudo: "Yasmine", canton: "VS", city: "Sion", languages: "fr,en", services: "Massage tantrique, Massage aux pierres chaudes" },
  { pseudo: "Elena", canton: "BS", city: "Bâle", languages: "de,ru,en", services: "Massage relaxant, Massage body-body" },
  { pseudo: "Chloé", canton: "VD", city: "Montreux", languages: "fr,en", services: "Massage aux huiles chaudes, Massage relaxant" },
  { pseudo: "Bianca", canton: "LU", city: "Lucerne", languages: "de,it,ro", services: "Massage tantrique, Massage californien" },
  { pseudo: "Maya", canton: "GE", city: "Carouge", languages: "fr,es,en", services: "Massage relaxant, Massage aux pierres chaudes, Massage tantrique" },
] as const;

const TEXTS = [
  "Masseuse indépendante, je vous accueille dans un cadre calme, propre et discret. Massages relaxants aux huiles chaudes, uniquement sur rendez-vous.",
  "Moment de détente dans un appartement privé, lumière douce et musique apaisante. Je prends le temps de vous écouter pour adapter le massage.",
  "Diplômée en massage bien-être, je propose des séances attentives et respectueuses. Douche à disposition, parking à proximité.",
  "Ambiance zen, linge propre et huiles de qualité. Je reçois en journée et en début de soirée, sur réservation par téléphone ou WhatsApp.",
];
const RATES = ["30 min : 120 CHF\n1 h : 200 CHF", "45 min : 160 CHF\n1 h : 220 CHF\n1 h 30 : 300 CHF", "1 h : 180 CHF\n2 h : 340 CHF"];
const HOURS = ["Lun–Ven 10h–20h\nSam sur rendez-vous", "Mar–Sam 12h–22h", "Tous les jours 9h–19h, sur rendez-vous"];
const dayKey = (offset: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" }).format(new Date(Date.now() - offset * 86400000));
const addMonths = (d: Date, m: number) => { const r = new Date(d); r.setMonth(r.getMonth() + m); return r; };

export async function createDemoData(db: PrismaClient, adminId: string | null) {
  if (await db.account.count({ where: { isDemo: true } })) return 0;
  const pw = await bcrypt.hash("demo-annonceuse", 10);
  const plans = await db.plan.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });
  let n = 0;
  for (const [i, d] of DEMO.entries()) {
    const phone = `+41 79 000 01 ${String(i + 10)}`;
    const pending = i === DEMO.length - 1; // une annonce en attente de modération, pour l'exemple
    const email = `${d.pseudo.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}.demo@exemple.ch`;
    if (await db.account.findUnique({ where: { email }, select: { id: true } })) continue;
    const acc = await db.account.create({
      data: {
        email, phone, passwordHash: pw, isDemo: true,
        status: pending ? "PENDING_VERIFICATION" : "VERIFIED", billingName: `${d.pseudo} (exemple)`, billingCity: d.city,
        verification: { create: { status: pending ? "PENDING" : "APPROVED", ageConfirmed: !pending, reviewedById: pending ? null : adminId, reviewedAt: pending ? null : new Date() } },
        listing: { create: {
          pseudo: d.pseudo, phone, canton: d.canton, city: d.city, languages: d.languages, services: d.services,
          description: TEXTS[i % TEXTS.length], rates: RATES[i % RATES.length], hours: HOURS[i % HOURS.length],
          status: pending ? "PENDING_REVIEW" : "PUBLISHED", publishedAt: pending ? null : new Date(Date.now() - (i + 1) * 86400000),
          photos: { create: [0, 1].map((k) => ({ url: `/demo/ambiance-${String(((i * 2 + k) % 24) + 1).padStart(2, "0")}.jpg`, approved: true, position: k })) },
        } },
      },
      include: { listing: true },
    });
    n++;
    if (pending) continue;
    await db.listingStatDaily.createMany({ data: Array.from({ length: 45 }, (_, k) => {
      const views = Math.round((15 + Math.random() * 45) * (1 - (i % 5) * 0.12));
      return { listingId: acc.listing!.id, day: dayKey(k), views, impressions: views * 4 + Math.round(Math.random() * 30),
        phoneClicks: Math.round(views * (0.05 + Math.random() * 0.06)), whatsappClicks: Math.round(views * (0.08 + Math.random() * 0.08)) };
    }) });
    const plan = plans[i % 4];
    if (i < 4 && plan) {
      const start = new Date(Date.now() - (i + 1) * 30 * 86400000);
      const price = plan.type === "CUSTOM" ? 0 : plan.priceCents;
      const sub = await db.subscription.create({ data: {
        accountId: acc.id, planId: plan.id, label: plan.type === "CUSTOM" ? "Offre de lancement (offerte)" : plan.name, priceCents: price,
        status: "ACTIVE", startDate: start, endDate: addMonths(start, plan.type === "CUSTOM" ? 3 : plan.durationMonths),
        photoShootStatus: plan.includesPhotoShoot ? "SCHEDULED" : "NONE", createdById: adminId,
      } });
      if (price) {
        await db.invoice.create({ data: {
          number: `DEMO-${String(i + 1).padStart(4, "0")}`, accountId: acc.id, subscriptionId: sub.id, label: `${plan.name} (${plan.durationMonths} mois)`,
          amountCents: price, status: i % 2 ? "SENT" : "PAID", issueDate: start, dueDate: new Date(start.getTime() + 30 * 86400000),
          paidAt: i % 2 ? null : new Date(start.getTime() + 4 * 86400000), paymentMethod: i % 2 ? null : "Virement bancaire",
          billingName: `${d.pseudo} (exemple)`, billingAddress: d.city,
        } });
      }
      if (plan.highlight) await db.listing.update({ where: { id: acc.listing!.id }, data: { highlighted: true } });
    }
    if (i === 1) {
      const c = await db.conversation.create({ data: { listingId: acc.listing!.id, token: `demo-${acc.id}`, visitorName: "Marc (exemple)", ownerUnread: 1 } });
      await db.message.createMany({ data: [
        { conversationId: c.id, fromOwner: false, body: "Bonjour, seriez-vous disponible jeudi vers 18h pour un massage d'une heure ?" },
      ] });
    }
    if (i === 2) {
      await db.report.create({ data: { listingId: acc.listing!.id, reason: "FAKE", message: "Signalement d'exemple : le numéro ne semble pas répondre." } });
    }
  }
  return n;
}

export async function deleteDemoData(db: PrismaClient) {
  const ids = (await db.account.findMany({ where: { isDemo: true }, select: { id: true } })).map((a) => a.id);
  if (!ids.length) return 0;
  const listingIds = (await db.listing.findMany({ where: { accountId: { in: ids } }, select: { id: true } })).map((l) => l.id);
  await db.invoice.deleteMany({ where: { accountId: { in: ids } } });
  await db.report.deleteMany({ where: { listingId: { in: listingIds } } });
  await db.account.deleteMany({ where: { id: { in: ids } } });
  return ids.length;
}

"use server";
// Toutes les actions de l'administration. Chaque modification est inscrite au journal.
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { signSession, SESSION_COOKIE } from "@/lib/session";
import { logAction } from "@/lib/log";
import { addMonths, toCents } from "@/lib/format";
import { saveUpload } from "@/lib/uploads";
import { deleteDocument } from "@/lib/vault";
import type {
  AccountStatus, InvoiceStatus, ListingStatus, PhotoShootStatus, PlanType, ReportStatus, SubscriptionStatus, VerificationStatus,
} from "@prisma/client";

// Longueurs maximales alignées sur les colonnes MySQL (VARCHAR 191 par défaut).
const LONG: Record<string, number> = { description: 3000, notes: 5000, services: 1000, rates: 1000, hours: 1000, billingAddress: 500, message: 5000, resolution: 5000 };
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim().slice(0, LONG[k] ?? 191);
const opt = (f: FormData, k: string) => s(f, k) || null;
const bool = (f: FormData, k: string) => f.get(k) === "on";
const list = (f: FormData, k: string) => f.getAll(k).map(String).filter(Boolean).join(",");

// ───────────── Connexion ─────────────

export async function login(f: FormData) {
  const admin = await db.adminUser.findUnique({ where: { email: s(f, "email").toLowerCase() } });
  if (!admin || !(await bcrypt.compare(s(f, "password"), admin.passwordHash))) redirect("/admin/login?erreur=1");
  const token = await signSession({ sub: admin.id, role: admin.role, name: admin.name });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 3600,
  });
  await logAction(admin.id, "Connexion", "admin", admin.id);
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ───────────── Comptes ─────────────

export async function saveAccount(f: FormData) {
  const me = await requireAdmin();
  const id = s(f, "id");
  const data = {
    email: s(f, "email").toLowerCase(),
    phone: s(f, "phone"),
    billingName: opt(f, "billingName"),
    billingAddress: opt(f, "billingAddress"),
    billingZip: opt(f, "billingZip"),
    billingCity: opt(f, "billingCity"),
  };
  if (id) {
    await db.account.update({ where: { id }, data });
    await logAction(me.sub, "Compte modifié", "account", id, data.email);
    revalidatePath(`/admin/comptes/${id}`);
    redirect(`/admin/comptes/${id}?ok=1`);
  }
  const acc = await db.account.create({ data: { ...data, verification: { create: {} } } });
  await logAction(me.sub, "Compte créé", "account", acc.id, data.email);
  redirect(`/admin/comptes/${acc.id}`);
}

export async function setAccountStatus(f: FormData) {
  const me = await requireAdmin();
  const id = s(f, "id");
  const status = s(f, "status") as AccountStatus;
  await db.account.update({ where: { id }, data: { status } });
  if (status === "SUSPENDED") {
    await db.listing.updateMany({ where: { accountId: id, status: "PUBLISHED" }, data: { status: "SUSPENDED" } });
  }
  await logAction(me.sub, `Statut du compte : ${status}`, "account", id, s(f, "reason"));
  revalidatePath(`/admin/comptes/${id}`);
}

export async function deleteAccount(f: FormData) {
  const me = await requireAdmin({ role: "ADMIN" });
  const id = s(f, "id");
  if (s(f, "confirm") !== "SUPPRIMER") redirect(`/admin/comptes/${id}?erreur=confirmation`);
  const acc = await db.account.findUnique({ where: { id }, include: { verification: true } });
  await deleteDocument(acc?.verification?.idDocumentRef);
  await deleteDocument(acc?.verification?.selfieRef);
  // Suppression complète (droit à l'effacement nLPD). Les factures restent (obligation comptable),
  // détachées du compte mais avec les coordonnées figées.
  await db.account.delete({ where: { id } });
  await logAction(me.sub, "Compte supprimé", "account", id, acc?.email ?? "");
  redirect("/admin/comptes?ok=supprime");
}

export async function reviewVerification(f: FormData) {
  const me = await requireAdmin();
  const accountId = s(f, "accountId");
  const status = s(f, "status") as VerificationStatus;
  const data = {
    status,
    ageConfirmed: bool(f, "ageConfirmed"),
    cantonalRequired: bool(f, "cantonalRequired"),
    cantonalRegistrationRef: opt(f, "cantonalRegistrationRef"),
    cantonalConfirmed: bool(f, "cantonalConfirmed"),
    notes: opt(f, "notes"),
    reviewedById: me.sub,
    reviewedAt: new Date(),
  };
  if (status === "APPROVED" && (!data.ageConfirmed || (data.cantonalRequired && !data.cantonalConfirmed))) {
    redirect(`/admin/comptes/${accountId}?erreur=verification`);
  }
  await db.identityVerification.upsert({ where: { accountId }, create: { accountId, ...data }, update: data });
  await db.account.update({
    where: { id: accountId },
    data: { status: status === "APPROVED" ? "VERIFIED" : "PENDING_VERIFICATION" },
  });
  await logAction(me.sub, `Vérification d'identité : ${status}`, "account", accountId, data.notes ?? "");
  revalidatePath(`/admin/comptes/${accountId}`);
  redirect(`/admin/comptes/${accountId}?ok=1`);
}

// ───────────── Annonces ─────────────

function listingData(f: FormData) {
  return {
    pseudo: s(f, "pseudo"),
    phone: s(f, "phone"),
    whatsapp: bool(f, "whatsapp"),
    canton: s(f, "canton"),
    city: s(f, "city"),
    description: s(f, "description"),
    services: s(f, "services"),
    rates: s(f, "rates"),
    hours: s(f, "hours"),
    languages: list(f, "languages"),
  };
}

export async function saveListing(f: FormData) {
  const me = await requireAdmin();
  const id = s(f, "id");
  const data = listingData(f);
  if (id) {
    await db.listing.update({ where: { id }, data });
    await logAction(me.sub, "Annonce modifiée", "listing", id, data.pseudo);
    revalidatePath(`/admin/annonces/${id}`);
    redirect(`/admin/annonces/${id}?ok=1`);
  }
  const accountId = s(f, "accountId");
  const existing = await db.listing.findUnique({ where: { accountId } });
  if (existing) redirect(`/admin/annonces/${existing.id}?erreur=une-annonce`);
  const l = await db.listing.create({ data: { ...data, accountId, status: "PENDING_REVIEW" } });
  await logAction(me.sub, "Annonce créée", "listing", l.id, data.pseudo);
  redirect(`/admin/annonces/${l.id}`);
}

export async function setListingStatus(f: FormData) {
  const me = await requireAdmin();
  const id = s(f, "id");
  const status = s(f, "status") as ListingStatus;
  const listing = await db.listing.findUniqueOrThrow({
    where: { id }, include: { account: { include: { verification: true } }, photos: true },
  });
  if (status === "PUBLISHED") {
    // Garde-fous : identité/âge vérifiés et toutes les photos modérées avant publication.
    if (listing.account.verification?.status !== "APPROVED") redirect(`/admin/annonces/${id}?erreur=verification`);
    if (listing.photos.some((p) => !p.approved)) redirect(`/admin/annonces/${id}?erreur=photos`);
  }
  await db.listing.update({
    where: { id },
    data: { status, publishedAt: status === "PUBLISHED" ? listing.publishedAt ?? new Date() : listing.publishedAt },
  });
  await logAction(me.sub, `Annonce : ${status}`, "listing", id, s(f, "reason"));
  revalidatePath(`/admin/annonces/${id}`);
  redirect(`/admin/annonces/${id}?ok=1`);
}

export async function deleteListing(f: FormData) {
  const me = await requireAdmin();
  const id = s(f, "id");
  if (s(f, "confirm") !== "SUPPRIMER") redirect(`/admin/annonces/${id}?erreur=confirmation`);
  const l = await db.listing.delete({ where: { id } });
  await logAction(me.sub, "Annonce supprimée", "listing", id, l.pseudo);
  redirect("/admin/annonces?ok=supprime");
}

export async function addPhoto(f: FormData) {
  const me = await requireAdmin();
  const listingId = s(f, "listingId");
  const file = f.get("file");
  let url = s(f, "url");
  if (file instanceof File && file.size > 0) url = await saveUpload(file);
  if (!url) redirect(`/admin/annonces/${listingId}?erreur=photo`);
  const count = await db.listingPhoto.count({ where: { listingId } });
  const p = await db.listingPhoto.create({
    data: { listingId, url, blurred: bool(f, "blurred"), source: s(f, "source") === "STUDIO" ? "STUDIO" : "OWNER", position: count },
  });
  await logAction(me.sub, "Photo ajoutée", "listing", listingId, p.id);
  revalidatePath(`/admin/annonces/${listingId}`);
}

export async function updatePhoto(f: FormData) {
  const me = await requireAdmin();
  const id = s(f, "id");
  const op = s(f, "op");
  const p = await db.listingPhoto.findUniqueOrThrow({ where: { id } });
  if (op === "delete") {
    await db.listingPhoto.delete({ where: { id } });
    await logAction(me.sub, "Photo supprimée", "listing", p.listingId, id);
  } else if (op === "approve" || op === "unapprove") {
    await db.listingPhoto.update({ where: { id }, data: { approved: op === "approve" } });
    await logAction(me.sub, op === "approve" ? "Photo validée" : "Photo retirée", "listing", p.listingId, id);
  } else if (op === "blur") {
    await db.listingPhoto.update({ where: { id }, data: { blurred: !p.blurred } });
    await logAction(me.sub, "Floutage modifié", "listing", p.listingId, id);
  }
  revalidatePath(`/admin/annonces/${p.listingId}`);
}

// ───────────── Formules d'abonnement ─────────────

export async function savePlan(f: FormData) {
  const me = await requireAdmin({ role: "ADMIN" });
  const id = s(f, "id");
  const data = {
    name: s(f, "name"),
    type: s(f, "type") as PlanType,
    description: s(f, "description").slice(0, 1000),
    priceCents: toCents(f.get("price")),
    durationMonths: Math.max(1, Number(s(f, "durationMonths")) || 1),
    includesPhotoShoot: bool(f, "includesPhotoShoot"),
    highlight: bool(f, "highlight"),
    active: bool(f, "active"),
  };
  const plan = id ? await db.plan.update({ where: { id }, data }) : await db.plan.create({ data });
  await logAction(me.sub, id ? "Formule modifiée" : "Formule créée", "plan", plan.id, data.name);
  redirect("/admin/abonnements/formules?ok=1");
}

// ───────────── Abonnements ─────────────

async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `PRX-${year}-`;
  const last = await db.invoice.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: "desc" } });
  const n = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
  return prefix + String(n).padStart(4, "0");
}

async function billingFor(accountId: string) {
  const a = await db.account.findUniqueOrThrow({ where: { id: accountId }, include: { listing: true } });
  return {
    billingName: a.billingName || a.listing?.pseudo || a.email,
    billingAddress: [a.billingAddress, [a.billingZip, a.billingCity].filter(Boolean).join(" ")].filter(Boolean).join("\n"),
  };
}

async function syncHighlight(accountId: string) {
  const active = await db.subscription.findFirst({
    where: { accountId, status: "ACTIVE", endDate: { gt: new Date() }, plan: { highlight: true } },
  });
  await db.listing.updateMany({ where: { accountId }, data: { highlighted: !!active } });
}

export async function createSubscription(f: FormData) {
  const me = await requireAdmin();
  const accountId = s(f, "accountId");
  const plan = await db.plan.findUniqueOrThrow({ where: { id: s(f, "planId") } });
  const custom = plan.type === "CUSTOM";
  const priceCents = custom || s(f, "price") ? toCents(f.get("price")) : plan.priceCents;
  const months = custom && s(f, "durationMonths") ? Math.max(1, Number(s(f, "durationMonths"))) : plan.durationMonths;
  const start = s(f, "startDate") ? new Date(s(f, "startDate")) : new Date();
  const free = priceCents === 0;
  const label = s(f, "label") || plan.name;

  const sub = await db.subscription.create({
    data: {
      accountId, planId: plan.id, label, priceCents,
      status: free || bool(f, "activateNow") ? "ACTIVE" : "PENDING_PAYMENT",
      startDate: start, endDate: addMonths(start, months),
      photoShootStatus: plan.includesPhotoShoot ? "TO_SCHEDULE" : "NONE",
      notes: opt(f, "notes"), createdById: me.sub,
    },
  });
  await logAction(me.sub, "Abonnement créé", "subscription", sub.id, `${label} – ${(priceCents / 100).toFixed(2)} CHF`);

  if (!free && bool(f, "createInvoice")) {
    const inv = await db.invoice.create({
      data: {
        number: await nextInvoiceNumber(), accountId, subscriptionId: sub.id,
        label: `${label} (${months} mois)`, amountCents: priceCents,
        vatRateBp: Number(process.env.VAT_RATE_BP ?? 0),
        status: "SENT", dueDate: new Date(Date.now() + 30 * 86400000),
        ...(await billingFor(accountId)),
      },
    });
    await logAction(me.sub, "Facture émise", "invoice", inv.id, inv.number);
  }
  await syncHighlight(accountId);
  redirect(`/admin/abonnements/${sub.id}`);
}

export async function updateSubscription(f: FormData) {
  const me = await requireAdmin();
  const id = s(f, "id");
  const data: Record<string, unknown> = {};
  if (s(f, "status")) data.status = s(f, "status") as SubscriptionStatus;
  if (s(f, "endDate")) data.endDate = new Date(s(f, "endDate"));
  if (s(f, "photoShootStatus")) data.photoShootStatus = s(f, "photoShootStatus") as PhotoShootStatus;
  if (f.has("photoShootDate")) data.photoShootDate = s(f, "photoShootDate") ? new Date(s(f, "photoShootDate")) : null;
  if (f.has("notes")) data.notes = opt(f, "notes");
  const sub = await db.subscription.update({ where: { id }, data });
  await logAction(me.sub, "Abonnement modifié", "subscription", id, JSON.stringify(data));
  await syncHighlight(sub.accountId);
  revalidatePath(`/admin/abonnements/${id}`);
  redirect(`/admin/abonnements/${id}?ok=1`);
}

export async function renewSubscription(f: FormData) {
  const me = await requireAdmin();
  const old = await db.subscription.findUniqueOrThrow({ where: { id: s(f, "id") }, include: { plan: true } });
  const start = old.endDate > new Date() ? old.endDate : new Date();
  const months = Math.max(1, Math.round((old.endDate.getTime() - old.startDate.getTime()) / (30.44 * 86400000)));
  const sub = await db.subscription.create({
    data: {
      accountId: old.accountId, planId: old.planId, label: old.label, priceCents: old.priceCents,
      status: old.priceCents === 0 ? "ACTIVE" : "PENDING_PAYMENT",
      startDate: start, endDate: addMonths(start, months), createdById: me.sub,
      photoShootStatus: old.plan.includesPhotoShoot ? "TO_SCHEDULE" : "NONE",
    },
  });
  if (old.priceCents > 0) {
    await db.invoice.create({
      data: {
        number: await nextInvoiceNumber(), accountId: old.accountId, subscriptionId: sub.id,
        label: `${old.label} – renouvellement (${months} mois)`, amountCents: old.priceCents,
        vatRateBp: Number(process.env.VAT_RATE_BP ?? 0), status: "SENT",
        dueDate: new Date(Date.now() + 30 * 86400000), ...(await billingFor(old.accountId)),
      },
    });
  }
  await logAction(me.sub, "Abonnement renouvelé", "subscription", sub.id, `depuis ${old.id}`);
  redirect(`/admin/abonnements/${sub.id}`);
}

// ───────────── Factures ─────────────

export async function createInvoice(f: FormData) {
  const me = await requireAdmin();
  const accountId = s(f, "accountId");
  const inv = await db.invoice.create({
    data: {
      number: await nextInvoiceNumber(), accountId,
      subscriptionId: opt(f, "subscriptionId"),
      label: s(f, "label"), amountCents: toCents(f.get("amount")),
      vatRateBp: Math.round(Number(s(f, "vatRate").replace(",", ".") || 0) * 100),
      status: "SENT",
      dueDate: s(f, "dueDate") ? new Date(s(f, "dueDate")) : new Date(Date.now() + 30 * 86400000),
      notes: opt(f, "notes"), ...(await billingFor(accountId)),
    },
  });
  await logAction(me.sub, "Facture émise", "invoice", inv.id, inv.number);
  redirect(`/admin/factures/${inv.id}`);
}

export async function setInvoiceStatus(f: FormData) {
  const me = await requireAdmin();
  const id = s(f, "id");
  const status = s(f, "status") as InvoiceStatus;
  const inv = await db.invoice.update({
    where: { id },
    data: {
      status,
      paidAt: status === "PAID" ? (s(f, "paidAt") ? new Date(s(f, "paidAt")) : new Date()) : null,
      paymentMethod: status === "PAID" ? opt(f, "paymentMethod") : null,
    },
  });
  // Paiement reçu : l'abonnement lié devient actif.
  if (status === "PAID" && inv.subscriptionId) {
    const sub = await db.subscription.findUnique({ where: { id: inv.subscriptionId } });
    if (sub?.status === "PENDING_PAYMENT") {
      await db.subscription.update({ where: { id: sub.id }, data: { status: "ACTIVE" } });
      await syncHighlight(sub.accountId);
    }
  }
  await logAction(me.sub, `Facture : ${status}`, "invoice", id, inv.number);
  revalidatePath(`/admin/factures/${id}`);
  redirect(`/admin/factures/${id}?ok=1`);
}

// ───────────── Signalements ─────────────

export async function updateReport(f: FormData) {
  const me = await requireAdmin();
  const id = s(f, "id");
  const status = s(f, "status") as ReportStatus;
  const r = await db.report.update({
    where: { id }, data: { status, resolution: opt(f, "resolution"), handledById: me.sub },
  });
  if (bool(f, "suspendListing") && r.listingId) {
    await db.listing.update({ where: { id: r.listingId }, data: { status: "SUSPENDED" } });
    await logAction(me.sub, "Annonce : SUSPENDED (signalement)", "listing", r.listingId, `signalement ${id}`);
  }
  await logAction(me.sub, `Signalement : ${status}`, "report", id, r.resolution ?? "");
  revalidatePath(`/admin/signalements/${id}`);
  redirect(`/admin/signalements/${id}?ok=1`);
}

// ───────────── Équipe ─────────────

export async function saveAdmin(f: FormData) {
  const me = await requireAdmin({ role: "ADMIN" });
  const email = s(f, "email").toLowerCase();
  const password = s(f, "password");
  if (password.length < 12) redirect("/admin/equipe?erreur=mdp");
  const a = await db.adminUser.create({
    data: { email, name: s(f, "name"), role: s(f, "role") === "ADMIN" ? "ADMIN" : "MODERATOR", passwordHash: await bcrypt.hash(password, 12) },
  });
  await logAction(me.sub, "Membre de l'équipe ajouté", "admin", a.id, email);
  redirect("/admin/equipe?ok=1");
}

export async function deleteAdmin(f: FormData) {
  const me = await requireAdmin({ role: "ADMIN" });
  const id = s(f, "id");
  if (id === me.sub) redirect("/admin/equipe?erreur=soi");
  const a = await db.adminUser.delete({ where: { id } });
  await logAction(me.sub, "Membre de l'équipe retiré", "admin", id, a.email);
  redirect("/admin/equipe?ok=1");
}

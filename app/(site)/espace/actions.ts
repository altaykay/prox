"use server";
// Actions de l'annonceuse sur son propre compte. Elle ne peut agir que sur SON compte (session prox_pro).
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { PRO_COOKIE, signPro } from "@/lib/session";
import { requirePro } from "@/lib/pro";
import { logAction } from "@/lib/log";
import { saveUpload } from "@/lib/uploads";
import { deleteDocument, storeDocument } from "@/lib/vault";
import { addMonths } from "@/lib/format";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (q = "ok=1") => redirect(`/espace?${q}`);
const BY = "par l'annonceuse";

async function openSession(accountId: string) {
  (await cookies()).set(PRO_COOKIE, await signPro(accountId), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 30 * 86400,
  });
}

export async function register(f: FormData) {
  const email = s(f, "email").toLowerCase();
  const password = s(f, "password");
  if (!["adult", "independent", "self", "terms"].every((k) => f.get(k) === "on")) redirect("/espace/inscription?erreur=conditions");
  if (password.length < 10) redirect("/espace/inscription?erreur=mdp");
  if (await db.account.findUnique({ where: { email } })) redirect("/espace/inscription?erreur=existe");
  const acc = await db.account.create({
    data: { email, phone: s(f, "phone"), passwordHash: await bcrypt.hash(password, 12), verification: { create: {} } },
  });
  await logAction(null, "Inscription", "account", acc.id, BY);
  await openSession(acc.id);
  redirect("/espace");
}

export async function proLogin(f: FormData) {
  const acc = await db.account.findUnique({ where: { email: s(f, "email").toLowerCase() } });
  if (!acc?.passwordHash || !(await bcrypt.compare(s(f, "password"), acc.passwordHash))) redirect("/espace/connexion?erreur=1");
  await openSession(acc.id);
  redirect("/espace");
}

export async function proLogout() {
  (await cookies()).delete(PRO_COOKIE);
  redirect("/");
}

export async function submitVerification(f: FormData) {
  const acc = await requirePro();
  const v = await db.identityVerification.findUnique({ where: { accountId: acc.id } });
  if (v?.status === "APPROVED") back();
  const id = f.get("idDocument"), selfie = f.get("selfie");
  if (!(id instanceof File) || !id.size || !(selfie instanceof File) || !selfie.size) back("erreur=documents");
  let idRef: string, selfieRef: string;
  try {
    idRef = await storeDocument(id as File);
    selfieRef = await storeDocument(selfie as File);
  } catch {
    back("erreur=format");
    return;
  }
  await deleteDocument(v?.idDocumentRef);
  await deleteDocument(v?.selfieRef);
  await db.identityVerification.upsert({
    where: { accountId: acc.id },
    create: { accountId: acc.id, idDocumentRef: idRef, selfieRef, cantonalRegistrationRef: s(f, "cantonalRef") || null },
    update: { idDocumentRef: idRef, selfieRef, cantonalRegistrationRef: s(f, "cantonalRef") || null, status: "PENDING" },
  });
  await logAction(null, "Documents d'identité envoyés", "account", acc.id, BY);
  back();
}

export async function saveMyListing(f: FormData) {
  const acc = await requirePro();
  if (acc.status === "SUSPENDED") back("erreur=suspendu");
  const data = {
    pseudo: s(f, "pseudo"), phone: s(f, "phone"), whatsapp: f.get("whatsapp") === "on", canton: s(f, "canton"), city: s(f, "city"),
    description: s(f, "description"), services: s(f, "services"), rates: s(f, "rates"), hours: s(f, "hours"),
    languages: f.getAll("languages").map(String).join(","),
  };
  // Toute modification repasse par la modération manuelle.
  const l = await db.listing.upsert({
    where: { accountId: acc.id },
    create: { ...data, accountId: acc.id, status: "PENDING_REVIEW" },
    update: { ...data, status: "PENDING_REVIEW" },
  });
  await logAction(null, "Annonce envoyée en modération", "listing", l.id, BY);
  back();
}

export async function addMyPhoto(f: FormData) {
  const acc = await requirePro();
  const l = await db.listing.findUnique({ where: { accountId: acc.id }, include: { _count: { select: { photos: true } } } });
  if (!l) back("erreur=annonce");
  if (l!._count.photos >= 12) back("erreur=maxphotos");
  const file = f.get("file");
  if (!(file instanceof File) || !file.size) back("erreur=photo");
  let url: string;
  try { url = await saveUpload(file as File); } catch { back("erreur=format"); return; }
  await db.listingPhoto.create({ data: { listingId: l!.id, url, blurred: f.get("blurred") === "on", position: l!._count.photos } });
  await logAction(null, "Photo envoyée (à modérer)", "listing", l!.id, BY);
  back();
}

export async function deleteMyPhoto(f: FormData) {
  const acc = await requirePro();
  const p = await db.listingPhoto.findFirst({ where: { id: s(f, "id"), listing: { accountId: acc.id } } });
  if (p) {
    await db.listingPhoto.delete({ where: { id: p.id } });
    await logAction(null, "Photo supprimée", "listing", p.listingId, BY);
  }
  revalidatePath("/espace");
}

export async function toggleMyPause() {
  const acc = await requirePro();
  const l = await db.listing.findUnique({ where: { accountId: acc.id } });
  if (!l) back();
  if (l!.status === "PUBLISHED") {
    await db.listing.update({ where: { id: l!.id }, data: { status: "PAUSED" } });
    await logAction(null, "Annonce mise en pause", "listing", l!.id, BY);
  } else if (l!.status === "PAUSED") {
    await db.listing.update({ where: { id: l!.id }, data: { status: "PUBLISHED" } });
    await logAction(null, "Annonce réactivée", "listing", l!.id, BY);
  }
  back();
}

export async function deleteMyListing(f: FormData) {
  const acc = await requirePro();
  if (s(f, "confirm") !== "SUPPRIMER") back("erreur=confirmation");
  const l = await db.listing.findUnique({ where: { accountId: acc.id } });
  if (l) {
    await db.listing.delete({ where: { id: l.id } });
    await logAction(null, "Annonce supprimée", "listing", l.id, BY);
  }
  back();
}

export async function deleteMyAccount(f: FormData) {
  const acc = await requirePro();
  if (s(f, "confirm") !== "SUPPRIMER") back("erreur=confirmation");
  const v = await db.identityVerification.findUnique({ where: { accountId: acc.id } });
  await deleteDocument(v?.idDocumentRef);
  await deleteDocument(v?.selfieRef);
  await db.account.delete({ where: { id: acc.id } });
  await logAction(null, "Compte supprimé", "account", acc.id, BY);
  (await cookies()).delete(PRO_COOKIE);
  redirect("/?compte=supprime");
}

export async function requestPlan(f: FormData) {
  const acc = await requirePro();
  const plan = await db.plan.findFirst({ where: { id: s(f, "planId"), active: true, type: { not: "CUSTOM" } } });
  if (!plan) back();
  const pending = await db.subscription.findFirst({ where: { accountId: acc.id, status: "PENDING_PAYMENT" } });
  if (pending) back("erreur=attente");
  const start = new Date();
  const sub = await db.subscription.create({
    data: {
      accountId: acc.id, planId: plan!.id, label: plan!.name, priceCents: plan!.priceCents, status: "PENDING_PAYMENT",
      startDate: start, endDate: addMonths(start, plan!.durationMonths), photoShootStatus: plan!.includesPhotoShoot ? "TO_SCHEDULE" : "NONE",
    },
  });
  const year = start.getFullYear(), prefix = `PRX-${year}-`;
  const last = await db.invoice.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: "desc" } });
  const number = prefix + String(last ? Number(last.number.slice(prefix.length)) + 1 : 1).padStart(4, "0");
  const listing = await db.listing.findUnique({ where: { accountId: acc.id } });
  await db.invoice.create({
    data: {
      number, accountId: acc.id, subscriptionId: sub.id, label: `${plan!.name} (${plan!.durationMonths} mois)`, amountCents: plan!.priceCents,
      vatRateBp: Number(process.env.VAT_RATE_BP ?? 0), status: "SENT", dueDate: new Date(Date.now() + 30 * 86400000),
      billingName: acc.billingName || listing?.pseudo || acc.email,
      billingAddress: [acc.billingAddress, [acc.billingZip, acc.billingCity].filter(Boolean).join(" ")].filter(Boolean).join("\n"),
    },
  });
  await logAction(null, "Abonnement demandé", "subscription", sub.id, BY);
  back("ok=abonnement");
}

export async function saveMyBilling(f: FormData) {
  const acc = await requirePro();
  await db.account.update({
    where: { id: acc.id },
    data: { billingName: s(f, "billingName") || null, billingAddress: s(f, "billingAddress") || null, billingZip: s(f, "billingZip") || null, billingCity: s(f, "billingCity") || null, phone: s(f, "phone") || acc.phone },
  });
  back();
}

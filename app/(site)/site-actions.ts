"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AGE_COOKIE } from "@/lib/session";
import { logAction } from "@/lib/log";
import type { ReportReason } from "@prisma/client";

export async function confirmAge(f: FormData) {
  (await cookies()).set(AGE_COOKIE, "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 30 * 86400 });
  const suite = String(f.get("suite") ?? "/");
  redirect(suite.startsWith("/") && !suite.startsWith("//") ? suite : "/");
}

const REASONS = ["TRAFFICKING", "MINOR", "THIRD_PARTY", "EXPLICIT", "FAKE", "OTHER"];

export async function submitReport(f: FormData) {
  const reason = String(f.get("reason"));
  const message = String(f.get("message") ?? "").trim().slice(0, 5000);
  if (!REASONS.includes(reason) || message.length < 5) redirect("/signaler?erreur=1");
  const listingId = String(f.get("listingId") ?? "") || null;
  const exists = listingId ? await db.listing.findUnique({ where: { id: listingId }, select: { id: true } }) : null;
  const r = await db.report.create({
    data: { reason: reason as ReportReason, message, contact: String(f.get("contact") ?? "").trim().slice(0, 191) || null, listingId: exists?.id ?? null },
  });
  await logAction(null, "Signalement reçu", "report", r.id, reason);
  redirect("/signaler?merci=1");
}

"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentAccountId } from "@/lib/pro";
import { logAction } from "@/lib/log";
import { MAX_IN_A_ROW, MSG_MAX, NAME_MAX, newToken, rememberToken, validToken } from "@/lib/messages";

const txt = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);

// Premier message du visiteur depuis la fiche d'une annonce.
export async function startConversation(f: FormData) {
  const listingId = txt(f, "listingId", 64);
  const back = `/annonce/${listingId}`;
  if (txt(f, "site", 200)) redirect(`${back}?message=ok`); // champ piège rempli par les robots
  const visitorName = txt(f, "name", NAME_MAX);
  const body = txt(f, "body", MSG_MAX);
  if (visitorName.length < 2 || body.length < 2) redirect(`${back}?message=erreur#message`);
  const l = await db.listing.findFirst({
    where: { id: listingId, status: "PUBLISHED", account: { status: "VERIFIED", isDemo: false } }, select: { id: true },
  });
  if (!l) redirect(`${back}?message=indisponible#message`);
  const token = newToken();
  await db.conversation.create({
    data: { listingId: l.id, token, visitorName, ownerUnread: 1, messages: { create: { fromOwner: false, body } } },
  });
  await rememberToken(token);
  redirect(`/messages/${token}?nouveau=1`);
}

// Réponse du visiteur dans une conversation existante.
export async function visitorReply(f: FormData) {
  const token = txt(f, "token", 64);
  if (!validToken(token)) redirect("/messages");
  const back = `/messages/${token}`;
  if (txt(f, "site", 200)) redirect(back);
  const body = txt(f, "body", MSG_MAX);
  if (body.length < 1) redirect(back);
  const c = await db.conversation.findUnique({
    where: { token }, include: { messages: { orderBy: { createdAt: "desc" }, take: MAX_IN_A_ROW, select: { fromOwner: true } } },
  });
  if (!c) redirect("/messages");
  if (c.blocked) redirect(`${back}?erreur=bloque`);
  if (c.messages.length >= MAX_IN_A_ROW && c.messages.every((m) => !m.fromOwner)) redirect(`${back}?erreur=attente`);
  await db.conversation.update({
    where: { id: c.id }, data: { ownerUnread: { increment: 1 }, messages: { create: { fromOwner: false, body } } },
  });
  await rememberToken(token);
  redirect(back);
}

// L'annonceuse ne peut agir que sur les conversations de SA propre annonce.
async function ownConversation(f: FormData) {
  const accountId = await currentAccountId();
  if (!accountId) redirect("/espace/connexion");
  const id = txt(f, "id", 64);
  const c = await db.conversation.findFirst({ where: { id, listing: { accountId } } });
  if (!c) redirect("/espace/messages");
  return { c, accountId };
}

export async function ownerReply(f: FormData) {
  const { c } = await ownConversation(f);
  const body = txt(f, "body", MSG_MAX);
  if (body.length >= 1 && !c.blocked) {
    await db.conversation.update({
      where: { id: c.id }, data: { visitorUnread: { increment: 1 }, messages: { create: { fromOwner: true, body } } },
    });
  }
  redirect(`/espace/messages/${c.id}`);
}

export async function toggleBlock(f: FormData) {
  const { c, accountId } = await ownConversation(f);
  await db.conversation.update({ where: { id: c.id }, data: { blocked: !c.blocked } });
  await logAction(null, c.blocked ? "Conversation débloquée" : "Conversation bloquée", "account", accountId, "par l'annonceuse");
  redirect(`/espace/messages/${c.id}`);
}

export async function deleteConversation(f: FormData) {
  const { c } = await ownConversation(f);
  await db.conversation.delete({ where: { id: c.id } });
  redirect("/espace/messages");
}

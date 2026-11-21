// Compteurs anonymes : vues, clics téléphone/WhatsApp. Aucune donnée personnelle stockée.
import { db } from "@/lib/db";
import { dayKey } from "@/lib/format";

const FIELDS = { view: "views", phone: "phoneClicks", whatsapp: "whatsappClicks" } as const;

export async function POST(req: Request) {
  let body: { id?: string; type?: string };
  try { body = await req.json(); } catch { return new Response(null, { status: 400 }); }
  const field = FIELDS[body.type as keyof typeof FIELDS];
  if (!field || !body.id) return new Response(null, { status: 400 });
  const ok = await db.listing.findFirst({ where: { id: body.id, status: "PUBLISHED" }, select: { id: true } });
  if (!ok) return new Response(null, { status: 404 });
  const day = dayKey();
  await db.listingStatDaily.upsert({
    where: { listingId_day: { listingId: body.id, day } },
    create: { listingId: body.id, day, [field]: 1 },
    update: { [field]: { increment: 1 } },
  });
  return new Response(null, { status: 204 });
}

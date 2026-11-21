import { db } from "./db";

export async function logAction(adminId: string | null, action: string, targetType: string, targetId: string, details = "") {
  await db.moderationLog.create({ data: { adminId, action, targetType, targetId, details } });
}

// Coffre des documents d'identité : stockage SÉPARÉ de la base et des photos publiques,
// chiffré (AES-256-GCM) avec une clé dédiée (VAULT_KEY). Seule une référence opaque est en base.
// En production : placer VAULT_DIR sur un volume/stockage distinct, accès restreint, et prévoir
// la suppression des documents après la durée de conservation définie dans la politique de confidentialité.
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "crypto";
import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import path from "path";

const dir = () => process.env.VAULT_DIR || path.join(process.cwd(), "storage", "vault");
const key = () => {
  const k = process.env.VAULT_KEY;
  if (!k) throw new Error("VAULT_KEY manquante");
  return createHash("sha256").update(k).digest();
};
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function storeDocument(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Format non accepté");
  if (file.size > 10 * 1024 * 1024) throw new Error("Fichier trop lourd (10 Mo max)");
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const header = Buffer.from(file.type.padEnd(32, " "));
  const enc = Buffer.concat([c.update(header), c.update(Buffer.from(await file.arrayBuffer())), c.final()]);
  const ref = randomUUID();
  await mkdir(dir(), { recursive: true });
  await writeFile(path.join(dir(), ref), Buffer.concat([iv, c.getAuthTag(), enc]), { mode: 0o600 });
  return ref;
}

export async function readDocument(ref: string): Promise<{ type: string; data: Buffer }> {
  if (!/^[0-9a-f-]{36}$/.test(ref)) throw new Error("Référence invalide");
  const buf = await readFile(path.join(dir(), ref));
  const d = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  const plain = Buffer.concat([d.update(buf.subarray(28)), d.final()]);
  return { type: plain.subarray(0, 32).toString().trim(), data: plain.subarray(32) };
}

export async function deleteDocument(ref?: string | null) {
  if (ref && /^[0-9a-f-]{36}$/.test(ref)) await unlink(path.join(dir(), ref)).catch(() => {});
}

// Stockage local des photos d'annonces (développement).
// En production : remplacer par un stockage objet (S3 compatible, hébergé en Suisse).
// Les pièces d'identité ne passent JAMAIS par ici : elles vont dans le coffre séparé.
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function saveUpload(file: File) {
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Format non accepté (JPEG, PNG ou WebP).");
  if (file.size > 8 * 1024 * 1024) throw new Error("Fichier trop lourd (8 Mo max).");
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

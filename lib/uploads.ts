// Stockage des photos d'annonces sur disque, dans UPLOAD_DIR (par défaut storage/uploads).
// Le dossier est hors de public/ : Next.js ne sert pas les fichiers ajoutés à public/ après la compilation,
// et un redéploiement depuis GitHub ne doit pas effacer les photos. Elles sont servies par app/uploads/[name]/route.ts.
// Les pièces d'identité ne passent JAMAIS par ici : elles vont dans le coffre séparé (lib/vault.ts).
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const uploadDir = () => process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");

export async function saveUpload(file: File) {
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Format non accepté (JPEG, PNG ou WebP).");
  if (file.size > 8 * 1024 * 1024) throw new Error("Fichier trop lourd (8 Mo max).");
  await mkdir(uploadDir(), { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(uploadDir(), name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

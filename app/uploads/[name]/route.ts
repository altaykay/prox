import { readFile } from "fs/promises";
import path from "path";
import { uploadDir } from "@/lib/uploads";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const m = /^[0-9a-f-]{36}\.(jpg|png|webp)$/.exec(name);
  if (!m) return new Response("Introuvable", { status: 404 });
  try {
    const data = await readFile(path.join(uploadDir(), name));
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": TYPES[m[1]], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}

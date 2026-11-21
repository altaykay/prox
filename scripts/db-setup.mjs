// Exécuté avant `next build` : crée / met à jour les tables MySQL puis crée l'admin et les formules.
// Ignoré si DATABASE_URL est absente ou si SKIP_DB_SETUP=1 (compilation sans base).
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
if (process.env.SKIP_DB_SETUP === "1" || !url.startsWith("mysql://")) {
  console.log("[db-setup] ignoré (pas de DATABASE_URL MySQL ou SKIP_DB_SETUP=1)");
  process.exit(0);
}
const run = (cmd) => execSync(cmd, { stdio: "inherit" });
run("npx prisma db push --skip-generate");
run("npx tsx prisma/seed.ts");

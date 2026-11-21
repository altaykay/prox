import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "../actions";
import { expireSubscriptions } from "@/lib/subscriptions";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  const site = await getSettings();
  await expireSubscriptions();
  const [pending, reports, unpaid] = await Promise.all([
    db.listing.count({ where: { status: "PENDING_REVIEW" } }),
    db.report.count({ where: { status: { not: "CLOSED" } } }),
    db.invoice.count({ where: { status: "SENT" } }),
  ]);
  const Count = ({ n }: { n: number }) => (n ? <span className="count">{n}</span> : null);
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/admin" className="brand">{site.siteName}<small>admin</small></Link>
          <form action={logout}><button type="submit">Déconnexion · {me.name}</button></form>
        </div>
        <nav className="nav">
          <Link href="/admin">Tableau de bord</Link>
          <Link href="/admin/annonces">Annonces <Count n={pending} /></Link>
          <Link href="/admin/comptes">Comptes</Link>
          <Link href="/admin/abonnements">Abonnements</Link>
          <Link href="/admin/factures">Factures <Count n={unpaid} /></Link>
          <Link href="/admin/statistiques">Statistiques</Link>
          <Link href="/admin/signalements">Signalements <Count n={reports} /></Link>
          <Link href="/admin/journal">Journal</Link>
          {me.role === "ADMIN" && <Link href="/admin/equipe">Équipe</Link>}
          {me.role === "ADMIN" && <Link href="/admin/parametres">Paramètres</Link>}
        </nav>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}

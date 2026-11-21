import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { date } from "@/lib/format";
import { Notice } from "@/components/ui";
import { deleteAdmin, saveAdmin } from "../../actions";

export default async function Team({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin({ role: "ADMIN" });
  const sp = await searchParams;
  const admins = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <>
      <div className="page-head"><h1>Équipe</h1></div>
      <Notice sp={sp} />
      <div className="table-wrap" style={{ marginBottom: 16 }}>
        <table>
          <thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Depuis</th><th></th></tr></thead>
          <tbody>{admins.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td><td>{a.email}</td><td>{a.role === "ADMIN" ? "Administrateur" : "Modérateur"}</td><td className="small">{date(a.createdAt)}</td>
              <td><form action={deleteAdmin}><input type="hidden" name="id" value={a.id} /><button className="btn small danger">Retirer</button></form></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <section className="card">
        <h2>Ajouter un membre</h2>
        <p className="muted small">Les modérateurs gèrent annonces, comptes, abonnements, factures et signalements. Seuls les administrateurs gèrent les formules, l'équipe et la suppression de comptes.</p>
        <form action={saveAdmin} className="fields cols-2">
          <label>Nom<input name="name" required /></label>
          <label>E-mail<input name="email" type="email" required /></label>
          <label>Mot de passe (12 caractères min.)<input name="password" type="password" minLength={12} required /></label>
          <label>Rôle<select name="role"><option value="MODERATOR">Modérateur</option><option value="ADMIN">Administrateur</option></select></label>
          <div><button className="btn primary">Ajouter</button></div>
        </form>
      </section>
    </>
  );
}

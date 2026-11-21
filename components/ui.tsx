import Link from "next/link";

const TONE: Record<string, string> = {
  PUBLISHED: "ok", ACTIVE: "ok", PAID: "ok", VERIFIED: "ok", APPROVED: "ok", CLOSED: "ok", DONE: "ok",
  PENDING_REVIEW: "warn", PENDING_PAYMENT: "warn", SENT: "warn", PENDING_VERIFICATION: "warn", PENDING: "warn",
  IN_PROGRESS: "warn", TO_SCHEDULE: "warn", SCHEDULED: "accent", PAUSED: "",
  SUSPENDED: "bad", REJECTED: "bad", OVERDUE: "bad", OPEN: "bad", CANCELLED: "", EXPIRED: "", DRAFT: "",
  TRAFFICKING: "bad", MINOR: "bad",
};

export function Badge({ value, labels }: { value: string; labels: Record<string, string> }) {
  return <span className={`badge ${TONE[value] ?? ""}`}>{labels[value] ?? value}</span>;
}

export function Notice({ sp }: { sp: { ok?: string; erreur?: string } }) {
  const errors: Record<string, string> = {
    verification: "Impossible : l'identité et l'âge (et l'enregistrement cantonal si exigé) doivent être validés d'abord.",
    photos: "Impossible de publier : toutes les photos doivent être validées (ou retirées) avant publication.",
    confirmation: "Tapez SUPPRIMER pour confirmer la suppression.",
    "une-annonce": "Ce compte a déjà une annonce (une annonce = une personne).",
    photo: "Ajoutez un fichier ou une adresse d'image.",
    droits: "Cette action est réservée aux administrateurs.",
    mdp: "Le mot de passe doit faire au moins 12 caractères.",
    soi: "Vous ne pouvez pas retirer votre propre accès.",
  };
  if (sp.erreur) return <div className="notice bad">{errors[sp.erreur] ?? "Une erreur est survenue."}</div>;
  if (sp.ok) return <div className="notice">{sp.ok === "supprime" ? "Supprimé." : "Enregistré."}</div>;
  return null;
}

export function Filters({ base, current, options, param = "statut" }: {
  base: string; current?: string; options: Record<string, string>; param?: string;
}) {
  return (
    <div className="filters">
      <Link href={base} className={!current ? "on" : ""}>Tous</Link>
      {Object.entries(options).map(([k, v]) => (
        <Link key={k} href={`${base}?${param}=${k}`} className={current === k ? "on" : ""}>{v}</Link>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

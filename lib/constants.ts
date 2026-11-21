export const CANTONS: Record<string, string> = {
  AG: "Argovie", AI: "Appenzell Rh.-Int.", AR: "Appenzell Rh.-Ext.", BE: "Berne", BL: "Bâle-Campagne",
  BS: "Bâle-Ville", FR: "Fribourg", GE: "Genève", GL: "Glaris", GR: "Grisons", JU: "Jura", LU: "Lucerne",
  NE: "Neuchâtel", NW: "Nidwald", OW: "Obwald", SG: "Saint-Gall", SH: "Schaffhouse", SO: "Soleure",
  SZ: "Schwytz", TG: "Thurgovie", TI: "Tessin", UR: "Uri", VD: "Vaud", VS: "Valais", ZG: "Zoug", ZH: "Zurich",
};

// Cantons où une annonce/inscription auprès des autorités est exigée pour l'activité.
// À vérifier et tenir à jour avec un conseil juridique : les règles changent.
export const CANTONS_WITH_REGISTRATION = ["GE", "VD", "NE", "FR", "VS", "JU", "TI", "BE"];

export const LANGUAGES: Record<string, string> = {
  fr: "Français", de: "Allemand", it: "Italien", en: "Anglais", es: "Espagnol", pt: "Portugais", ru: "Russe", ro: "Roumain",
};

export const LISTING_STATUS: Record<string, string> = {
  DRAFT: "Brouillon", PENDING_REVIEW: "En attente", PUBLISHED: "Publiée", PAUSED: "En pause", SUSPENDED: "Suspendue", REJECTED: "Refusée",
};
export const ACCOUNT_STATUS: Record<string, string> = {
  PENDING_VERIFICATION: "À vérifier", VERIFIED: "Vérifié", SUSPENDED: "Suspendu",
};
export const VERIFICATION_STATUS: Record<string, string> = { PENDING: "En attente", APPROVED: "Validée", REJECTED: "Refusée" };
export const PLAN_TYPE: Record<string, string> = {
  PHOTO: "Avec photos par l'équipe", ANNUAL: "Payé à l'année", CUSTOM: "Sur mesure (admin)",
};
export const SUB_STATUS: Record<string, string> = {
  PENDING_PAYMENT: "En attente de paiement", ACTIVE: "Actif", EXPIRED: "Expiré", CANCELLED: "Annulé",
};
export const SHOOT_STATUS: Record<string, string> = {
  NONE: "—", TO_SCHEDULE: "À planifier", SCHEDULED: "Planifiée", DONE: "Réalisée",
};
export const INVOICE_STATUS: Record<string, string> = {
  DRAFT: "Brouillon", SENT: "Envoyée", PAID: "Payée", CANCELLED: "Annulée", OVERDUE: "En retard",
};
export const REPORT_REASON: Record<string, string> = {
  TRAFFICKING: "Soupçon de traite / contrainte", MINOR: "Soupçon de minorité", THIRD_PARTY: "Gérée par un tiers",
  EXPLICIT: "Contenu explicite", FAKE: "Fausse annonce / arnaque", OTHER: "Autre",
};
export const REPORT_STATUS: Record<string, string> = { OPEN: "Ouvert", IN_PROGRESS: "En cours", CLOSED: "Clos" };

export const HELP_CONTACTS = [
  { name: "Police (urgence)", detail: "117" },
  { name: "FIZ – Centre d'assistance aux migrantes et victimes de la traite (Zurich)", detail: "fiz-info.ch" },
  { name: "Aspasie (Genève)", detail: "aspasie.ch" },
  { name: "Fleur de Pavé (Lausanne)", detail: "fleurdepave.ch" },
  { name: "Plateforme Traite (ACT212) – ligne nationale", detail: "act212.ch" },
];

// Coordonnées de l'émetteur des factures : voir /admin/parametres (lib/settings.ts).

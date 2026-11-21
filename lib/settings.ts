// Paramètres du site modifiables depuis /admin/parametres.
// Une valeur vide ou absente en base reprend la valeur par défaut ci-dessous.
import { cache } from "react";
import { db } from "./db";

type Field = { label: string; help?: string; type?: "text" | "textarea" | "long"; default: () => string };
type Group = { title: string; intro?: string; fields: Record<string, Field> };

export const SETTINGS_GROUPS: Group[] = [
  {
    title: "Identité du site",
    fields: {
      siteName: { label: "Nom du site", help: "Affiché dans l'en-tête, les onglets, les factures et les pages légales.", default: () => "Prox" },
      siteDomain: { label: "Adresse du site (domaine)", help: "Ex. www.prox.ch. Sert aux liens et aux factures. Le domaine lui-même se branche dans Hostinger.", default: () => "" },
      contactEmail: { label: "E-mail de contact", help: "Affiché dans les mentions légales et la politique de confidentialité.", default: () => "" },
      metaDescription: { label: "Description (moteurs de recherche, partage)", type: "textarea", default: () => "Annonces de masseuses indépendantes et majeures en Suisse, vérifiées avant publication." },
    },
  },
  {
    title: "Page d'accueil et pied de page",
    fields: {
      heroTitle: { label: "Titre de l'accueil", default: () => "Massages en Suisse, en toute discrétion" },
      heroSubtitle: { label: "Sous-titre de l'accueil", default: () => "Masseuses indépendantes et majeures, identité vérifiée avant chaque publication." },
      gateText: { label: "Texte de la page d'entrée 18+", type: "textarea", default: () => "Ce site contient des annonces de massages érotiques destinées exclusivement aux adultes." },
      footerText: { label: "Texte du pied de page", type: "textarea", default: () => "Annonces gratuites de masseuses majeures et indépendantes, vérifiées avant publication. Aucune commission sur les prestations. Réservé aux personnes de 18 ans et plus." },
    },
  },
  {
    title: "Société et facturation",
    intro: "Utilisé sur les factures et dans les mentions légales.",
    fields: {
      issuerName: { label: "Raison sociale", default: () => process.env.ISSUER_NAME || "" },
      issuerAddress: { label: "Adresse", type: "textarea", default: () => process.env.ISSUER_ADDRESS || "" },
      issuerIde: { label: "Numéro IDE (CHE-…)", default: () => "" },
      issuerManager: { label: "Responsable de la publication", default: () => "" },
      issuerIban: { label: "IBAN pour les virements", default: () => process.env.ISSUER_IBAN || "" },
      issuerVat: { label: "Numéro de TVA (vide si non assujetti)", default: () => process.env.ISSUER_VAT || "" },
      vatRate: { label: "Taux de TVA en % (0 si non assujetti)", help: "Ex. 8.1", default: () => String(Number(process.env.VAT_RATE_BP ?? 0) / 100) },
      hostingProvider: { label: "Hébergeur (mentions légales)", default: () => "Hostinger International Ltd." },
    },
  },
  {
    title: "Textes des pages",
    intro: "Laissez vide pour garder le texte proposé par défaut. Mise en forme simple : une ligne « ## Titre » crée un titre, une ligne « - texte » une puce, une ligne vide sépare les paragraphes.",
    fields: {
      pageCgu: { label: "Conditions d'utilisation", type: "long", default: () => "" },
      pageConfidentialite: { label: "Politique de confidentialité", type: "long", default: () => "" },
      pageMentions: { label: "Mentions légales (texte complémentaire)", type: "long", default: () => "" },
      pageAide: { label: "Aide et sécurité (texte complémentaire, affiché en haut)", type: "long", default: () => "" },
    },
  },
];

export const SETTING_KEYS = SETTINGS_GROUPS.flatMap((g) => Object.keys(g.fields));
const FIELDS: Record<string, Field> = Object.assign({}, ...SETTINGS_GROUPS.map((g) => g.fields));
export const settingMaxLength = (key: string) => (FIELDS[key]?.type === "long" ? 60000 : FIELDS[key]?.type === "textarea" ? 2000 : 300);

export type Settings = Record<string, string> & { siteName: string };

// Lu une fois par requête. Si la table n'existe pas encore (avant la 1re migration), on garde les valeurs par défaut.
export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.setting.findMany().catch(() => []);
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const out: Record<string, string> = {};
  for (const k of SETTING_KEYS) out[k] = stored[k]?.trim() ? stored[k] : FIELDS[k].default();
  if (!out.siteName.trim()) out.siteName = "Prox";
  return out as Settings;
});

export const vatRateBp = (s: Settings) => Math.round(Number(String(s.vatRate).replace(",", ".")) * 100) || 0;

# Prox

Site d'annonces pour masseuses majeures et indépendantes en Suisse, avec espace annonceuse et administration.
Next.js 15 (App Router, Server Actions) · Prisma · SQLite en développement (PostgreSQL en production).

## Démarrer

```bash
cp .env.example .env        # puis changer AUTH_SECRET, VAULT_KEY, ADMIN_PASSWORD
npm install
npm run db:push             # crée la base
npm run db:seed             # admin + 3 formules + données de démonstration
npm run dev                 # http://localhost:3000
```

- Site public : `/` (page d'entrée 18+ d'abord)
- Espace annonceuse : `/espace` (démo : `lea@exemple.ch` / `demo-annonceuse`)
- Administration : `/admin` (identifiants `ADMIN_EMAIL` / `ADMIN_PASSWORD` du `.env`)

## Ce que fait l'application

**Visiteurs** : confirmation d'âge, recherche par canton / ville / langue, fiche avec boutons Appeler et WhatsApp, signalement, page Aide & sécurité (police, FIZ, ACT212, Aspasie, Fleur de Pavé, LAVI), CGU, confidentialité nLPD, mentions légales.

**Annonceuses** (`/espace`) : inscription avec engagements (18+, indépendante, compte personnel), envoi pièce d'identité + selfie (+ référence cantonale), rédaction de l'annonce, photos (floutage possible), pause / réactivation, suppression de l'annonce ou du compte, statistiques, demande d'un service optionnel et factures.

**Administration** (`/admin`)
- Tableau de bord : annonces à modérer, identités à vérifier, signalements urgents, impayés, encaissé du mois, abonnements qui expirent.
- Annonces : créer, modifier, valider/publier, pause, refuser, suspendre, supprimer ; validation et floutage des photos. La publication est bloquée tant que l'identité n'est pas validée et que des photos ne sont pas modérées.
- Comptes : fiche complète, vérification d'identité (documents consultés depuis le coffre chiffré, chaque consultation journalisée), enregistrement cantonal, suspension, suppression totale (droit à l'effacement).
- Abonnements : 3 formules créées par défaut et modifiables — **Pack Photo Pro** (séance photo par l'équipe, suivi « à planifier / planifiée / réalisée »), **Annuel** (payé à l'année), **Sur mesure** (prix et durée libres, ou offert, attribué depuis l'admin). Renouvellement en un clic, expiration automatique, mise en avant des annonces abonnées.
- Factures : numérotation PRX-AAAA-NNNN, émission automatique à la création d'un abonnement, paiement (virement, TWINT, espèces), retards, annulation, facture imprimable / PDF, export CSV pour la comptabilité. Un paiement active l'abonnement lié.
- Statistiques : affichages en recherche, vues, clics téléphone, clics WhatsApp, taux de contact ; par annonce avec graphiques 7/30/90/365 jours. Anonymes et agrégées par jour (aucune IP).
- Signalements (urgents en premier, procédure traite), journal de toutes les actions, gestion de l'équipe (administrateurs / modérateurs).

## Sécurité et données
- Une annonce = une personne : contrainte unique en base (`Listing.accountId`).
- Pièces d'identité et selfies : chiffrés AES-256-GCM (`VAULT_KEY`), stockés dans `storage/vault` hors du dossier public et hors de la base ; seule une référence opaque est en base.
- Sessions signées séparées pour l'équipe et les annonceuses ; `/admin` en `noindex`.

## Avant la mise en ligne (à faire)
1. Faire relire CGU, confidentialité et mentions légales par un juriste ; compléter les `[…]`.
2. Vérifier la liste `CANTONS_WITH_REGISTRATION` (lib/constants.ts) canton par canton et les contacts d'aide.
3. Production : PostgreSQL (`provider = "postgresql"`), stockage objet pour les photos, volume séparé pour `VAULT_DIR`, hébergeur en Suisse qui accepte les contenus pour adultes.
4. Retirer les métadonnées EXIF (GPS) des photos à l'envoi ; réinitialisation de mot de passe par e-mail ; limitation du nombre de tentatives de connexion.
5. Paiement en ligne : beaucoup de prestataires (dont Stripe) refusent ce secteur. La facturation par virement est en place ; QR-facture et paiement en ligne à ajouter avec un prestataire qui accepte l'activité.
6. Renseigner `ISSUER_NAME`, `ISSUER_ADDRESS`, `ISSUER_IBAN`, `ISSUER_VAT`, `VAT_RATE_BP` (810 = 8,1 % si assujetti).

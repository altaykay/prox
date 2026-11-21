# Prox

Site d'annonces pour masseuses majeures et indépendantes en Suisse, avec espace annonceuse et administration.
Next.js 15 (App Router, Server Actions) · Prisma · MySQL / MariaDB (base fournie par Hostinger).

## Démarrer

```bash
cp .env.example .env        # renseigner DATABASE_URL (MySQL), AUTH_SECRET, VAULT_KEY, ADMIN_PASSWORD
npm install
npm run db:push             # crée les tables
SEED_DEMO=1 npm run db:seed # admin + 3 formules (+ données de démonstration avec SEED_DEMO=1)
npm run dev                 # http://localhost:3000
```

- Site public : `/` (page d'entrée 18+ d'abord)
- Espace annonceuse : `/espace` (démo : `lea@exemple.ch` / `demo-annonceuse`)
- Administration : `/admin` (identifiants `ADMIN_EMAIL` / `ADMIN_PASSWORD` du `.env`)

## Mise en ligne sur Hostinger (application web Node.js)

1. hPanel > Bases de données > MySQL : créer une base et un utilisateur, puis `DATABASE_URL="mysql://UTILISATEUR:MOT_DE_PASSE@localhost:3306/BASE"`.
2. hPanel > Sites web > Créer un site > Application web Node.js > importer depuis GitHub (`altaykay/prox`, branche `main`).
3. Réglages : framework Next.js, Node 20 ou 22, commande de build `npm run build` (crée/met à jour les tables, crée l'admin et les formules via `scripts/db-setup.mjs`, puis compile ; `SKIP_DB_SETUP=1` pour compiler sans base), démarrage `npm start`.
4. Variables d'environnement : celles de `.env.example`. Mettre `UPLOAD_DIR` et `VAULT_DIR` sur des dossiers hors du dossier de l'application pour que photos et pièces d'identité survivent aux redéploiements. Ne jamais mettre `SEED_DEMO=1` en production.
5. Brancher le domaine et activer le SSL dans hPanel.

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
- Pièces d'identité et selfies : chiffrés AES-256-GCM (`VAULT_KEY`), stockés dans `VAULT_DIR` (par défaut `storage/vault`) hors du dossier public et hors de la base ; seule une référence opaque est en base.
- Photos d'annonces : stockées dans `UPLOAD_DIR` (par défaut `storage/uploads`) et servies par la route `/uploads/[nom]`.
- Sessions signées séparées pour l'équipe et les annonceuses ; `/admin` en `noindex`.

## Avant la mise en ligne (à faire)
1. Faire relire CGU, confidentialité et mentions légales par un juriste ; compléter les `[…]`.
2. Vérifier la liste `CANTONS_WITH_REGISTRATION` (lib/constants.ts) canton par canton et les contacts d'aide.
3. Production : dossiers `UPLOAD_DIR` et `VAULT_DIR` persistants et sauvegardés ; sauvegardes régulières de la base MySQL.
4. Retirer les métadonnées EXIF (GPS) des photos à l'envoi ; réinitialisation de mot de passe par e-mail ; limitation du nombre de tentatives de connexion.
5. Paiement en ligne : beaucoup de prestataires (dont Stripe) refusent ce secteur. La facturation par virement est en place ; QR-facture et paiement en ligne à ajouter avec un prestataire qui accepte l'activité.
6. Renseigner `ISSUER_NAME`, `ISSUER_ADDRESS`, `ISSUER_IBAN`, `ISSUER_VAT`, `VAT_RATE_BP` (810 = 8,1 % si assujetti).

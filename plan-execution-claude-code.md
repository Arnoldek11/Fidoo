# Plan d'exécution — À suivre avec Claude Code

Ce fichier est fait pour être donné directement à Claude Code, phase par phase. Ne passe jamais à la phase suivante avant que les critères de validation de la phase en cours soient tous cochés.

**Règle d'usage** : à chaque nouvelle session, colle la section de la phase en cours à Claude Code comme prompt, une tranche à la fois. Ne demande jamais "fais tout le projet" en un coup.

---

## Fichier `CLAUDE.md` à créer en premier, à la racine du repo

```markdown
# Conventions du projet

- Stack : Next.js 14+ App Router, TypeScript strict, Prisma, Postgres (Supabase), Tailwind, shadcn/ui
- Toute nouvelle table Prisma doit avoir un champ establishment_id et une policy RLS associée créée dans la même tâche
- Jamais de logique métier dans les composants UI — toujours dans /lib ou /server
- Toujours écrire les tests Vitest en même temps que le code, jamais après
- Utiliser des Server Actions Next.js plutôt que des routes API, sauf pour les webhooks externes (Stripe, Twilio, Apple)
- Validation de tout input serveur avec Zod, jamais confiance au frontend
- Le journal d'événements (table events) est immuable : jamais d'UPDATE ni de DELETE dessus, seulement des INSERT
- Les soldes, statuts, et statistiques sont toujours calculés à partir de la table events, jamais stockés comme un champ qu'on modifie
- Clés API et secrets uniquement en variables d'environnement (.env.local, jamais commité)
- Avant chaque migration Prisma qui touche une table existante, demander confirmation explicite
```

---

## Phase 0 — Squelette du projet

**Objectif** : un projet vide qui tourne en production, pipeline vérifié.

### Étapes
1. `npx create-next-app@latest` — TypeScript, Tailwind, App Router, ESLint activés
2. Initialiser le repo Git, premier commit, push sur GitHub
3. Créer le fichier `CLAUDE.md` ci-dessus à la racine
4. Créer un compte Supabase, un nouveau projet, récupérer les clés
5. Créer un compte Vercel, connecter le repo GitHub, premier déploiement
6. Configurer les variables d'environnement sur Vercel (URL Supabase, clés)
7. Ajouter le nom de domaine personnalisé sur Vercel (settings → domains)

### Tests / Validation
- [ ] Une page "Hello" s'affiche sur l'URL Vercel par défaut
- [ ] La même page s'affiche sur ton nom de domaine personnalisé, avec HTTPS actif
- [ ] `.env.local` est bien dans `.gitignore`, vérifié en cherchant "env" dans le repo GitHub en ligne — aucun secret ne doit apparaître
- [ ] Le repo a un commit initial propre, `CLAUDE.md` présent

---

## Phase 1 — Fondation multi-tenant + sécurité

**Objectif** : deux comptes restaurateurs différents, isolation totale des données vérifiée par un test explicite.

### Étapes
1. Prisma : schéma initial avec table `establishments` (id, name, city, plan, created_at)
2. Prisma : table `establishment_users` (id, establishment_id, email, role, created_at), liée à Supabase Auth
3. Activer Row-Level Security sur les deux tables dans Supabase, policy : un utilisateur ne voit que les lignes où `establishment_id` correspond à son établissement
4. Page de connexion (email/mot de passe) via Supabase Auth
5. Dashboard vide protégé par auth : "Bienvenue {nom établissement}"
6. Activer 2FA sur ton propre compte admin Supabase (pas dans le code, dans les settings du compte)

### Tests / Validation
- [ ] Créer deux comptes établissement de test (ex. "Café A" et "Café B")
- [ ] Écrire un test automatisé (Vitest ou test manuel documenté) qui essaie de lire les données de "Café B" en étant connecté en tant que "Café A" → doit échouer
- [ ] Se connecter avec chaque compte et vérifier visuellement qu'on ne voit que son propre établissement
- [ ] Tenter d'accéder au dashboard sans être connecté → redirection vers login
- [ ] 2FA actif et testé sur le compte admin

**Ne pas avancer à la Phase 2 tant que le test d'isolation ci-dessus n'est pas explicitement vérifié.**

---

## Phase 2 — Boucle centrale : identification client + points

**Objectif** : un client réel peut être scanné, un point est ajouté, l'historique est visible et correct.

### Étapes
1. Prisma : table `customers` (id, establishment_id, phone, name nullable, consent_given_at, consent_channel, created_at)
2. Prisma : table `events` (id, establishment_id, customer_id, type, metadata jsonb, created_at) — type ∈ {visit, points_added, reward_redeemed}
3. RLS sur les deux nouvelles tables, même pattern que Phase 1
4. Server Action `addVisit(establishmentId, customerId)` qui insère un event, jamais de update direct d'un solde
5. Fonction `getCustomerBalance(customerId)` qui calcule le solde en agrégeant les events — pas de champ stocké
6. Écran de scan côté personnel : génération/lecture de QR (lib `html5-qrcode` ou équivalent), formulaire de secours pour saisir le téléphone manuellement
7. Flow d'inscription client : premier scan → capture téléphone + consentement (case à cocher explicite, horodatée)

### Tests / Validation
- [ ] Test unitaire : `addVisit` insère bien un event, jamais de modification d'un champ solde existant
- [ ] Test unitaire : `getCustomerBalance` retourne le bon total après plusieurs events insérés dans le désordre temporel
- [ ] Test manuel : scanner un QR avec un vrai téléphone, vérifier que l'event apparaît en base en moins d'une seconde
- [ ] Vérifier qu'un client sans consentement enregistré ne peut pas recevoir de communication plus tard (contrainte vérifiée dès cette phase, même si l'envoi arrive en Phase 5)
- [ ] Tenter d'insérer un event avec un `establishment_id` qui ne correspond pas à l'utilisateur connecté → doit échouer (RLS)

---

## Phase 3 — Dashboard restaurateur v1

**Objectif** : le restaurateur comprend sa base client en quelques secondes.

### Étapes
1. Page liste clients : téléphone/nom, nombre de visites, date dernière visite, triable
2. Trois indicateurs en haut de dashboard : clients actifs, visites cette semaine, clients à risque (calcul : pas de visite depuis 21+ jours, dérivé de `events`)
3. Fiche client individuelle : historique complet des events dans l'ordre chronologique

### Tests / Validation
- [ ] Les trois indicateurs recalculent correctement après ajout d'un nouvel event (rafraîchir la page, vérifier le changement)
- [ ] Un client à 22 jours d'inactivité apparaît bien dans "à risque", un client à 20 jours non
- [ ] La liste reste correcte et rapide avec au moins 200 clients de test générés (script de seed à écrire)

---

## Phase 4 — Wallet passes Apple + Google

**Objectif** : un client ajoute la carte à son wallet et voit son solde se mettre à jour en temps réel après un scan.

### Étapes
1. Configurer le compte développeur Apple, générer les certificats de signature de pass
2. Intégrer `passkit-generator`, générer un `.pkpass` de test avec logo et champs dynamiques (solde, barre de progression)
3. Endpoint de mise à jour : quand un event `points_added` est créé, déclencher un push vers l'appareil Apple (webhook dédié Apple Wallet)
4. Répéter pour Google Wallet (API REST + JWT), séparément — ne pas supposer que la logique Apple se transpose 1:1
5. Bouton "Ajouter à Apple Wallet" / "Ajouter à Google Wallet" sur la page d'inscription client

### Tests / Validation
- [ ] Un pass de test s'ajoute correctement à un vrai iPhone
- [ ] Un pass de test s'ajoute correctement à un vrai téléphone Android
- [ ] Ajouter un point manuellement en base → vérifier que le solde affiché sur le pass déjà ajouté se met à jour sans réouvrir quoi que ce soit, sur les deux plateformes séparément
- [ ] Vérifier le rendu visuel (logo, couleurs, barre de progression) sur les deux plateformes — elles ne rendent pas identiquement

---

## Phase 5 — Automatisation win-back + attribution

**Objectif** : une vraie campagne automatique part, et un retour de client peut lui être attribué avec un chiffre de CA.

### Étapes
1. Intégrer Inngest, job planifié nocturne : détecter les clients à 21+ jours d'inactivité par établissement
2. Envoi SMS via Twilio, message personnalisé, event `campaign_sent` créé avec le customer_id ciblé
3. Vérification de signature sur le webhook Twilio de statut de livraison
4. Logique d'attribution : si un event `visit` arrive dans les 14 jours suivant un `campaign_sent` pour le même client → créer un event `attributed_return` avec le panier moyen de l'établissement en metadata
5. Widget dashboard : "Cette campagne a ramené X clients, ~Y€ de CA attribué"

### Tests / Validation
- [ ] Simuler un client à 22 jours d'inactivité en base de test → vérifier que le job nocturne le détecte et déclenche l'envoi
- [ ] Vérifier qu'un client à 19 jours n'est pas ciblé
- [ ] Simuler une visite 5 jours après un `campaign_sent` → vérifier la création correcte de l'`attributed_return`
- [ ] Simuler une visite 20 jours après (hors fenêtre de 14 jours) → vérifier qu'aucune attribution n'est créée
- [ ] Tester le rate limiting Twilio / gestion d'erreur si l'envoi SMS échoue (numéro invalide) — ne doit pas planter le job pour les autres clients de la même campagne

---

## Phase 6 — Facturation Stripe

**Objectif** : un établissement peut passer d'un plan gratuit pilote à un plan payant, proprement.

### Étapes
1. Configurer Stripe Billing, créer les produits/prix (Standard 49€, Growth 89-99€)
2. Page de gestion d'abonnement côté restaurateur (Stripe Customer Portal, ne pas réinventer une UI de facturation)
3. Webhook Stripe : mise à jour du `plan` de l'établissement selon les événements d'abonnement, avec vérification de signature obligatoire
4. Logique de fonctionnalités limitées par plan (ex. automatisations avancées seulement en Growth)

### Tests / Validation
- [ ] Un paiement de test Stripe (mode test) met bien à jour le plan de l'établissement en base
- [ ] Un webhook Stripe sans signature valide est bien rejeté (test explicite avec une fausse requête)
- [ ] Une annulation d'abonnement rétrograde bien l'établissement au plan gratuit/pilote sans perte de données existantes

---

## Phase 7 — RGPD et conformité

### Étapes
1. Page de politique de confidentialité et conditions d'utilisation
2. Fonction de suppression en cascade d'un client (droit à l'oubli) : supprime le `customer` et anonymise ses `events` associés plutôt que de casser l'intégrité du journal
3. Registre des sous-traitants (Twilio, Supabase, Stripe) documenté
4. Log d'audit des accès sensibles (qui a consulté/supprimé quelles données client)

### Tests / Validation
- [ ] Demander la suppression d'un client de test → vérifier qu'il n'apparaît plus dans le dashboard et que ses données personnelles sont bien effacées
- [ ] Vérifier que l'historique agrégé (stats globales de l'établissement) reste cohérent après une suppression (pas de crash, pas de trou dans les stats)

---

## Phase 8 — Pré-lancement pilotes

### Étapes
1. Brancher Sentry en production, vérifier la remontée d'une erreur test
2. Activer Dependabot sur GitHub
3. Script de backup testé : restaurer une copie de la base de test à partir d'un backup Supabase
4. Créer 3-5 comptes établissement réels pour les premiers pilotes identifiés dans le plan terrain

### Tests / Validation
- [ ] Une erreur volontairement déclenchée en environnement de test apparaît bien dans Sentry en quelques minutes
- [ ] Un backup restauré contient bien les bonnes données, testé au moins une fois
- [ ] Checklist de sécurité complète repassée une dernière fois avant d'onboarder le premier vrai client (RLS, secrets, 2FA, rate limiting)

---

## Rappel — ordre à respecter

Ne jamais démarrer une phase avant que toutes les cases de validation de la précédente soient cochées. Le point le plus critique de tout le plan est le test d'isolation multi-tenant en Phase 1 — c'est celui qui, s'il est bâclé, peut exposer les données d'un établissement à un autre.

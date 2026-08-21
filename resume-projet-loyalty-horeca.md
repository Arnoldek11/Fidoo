# Résumé du projet — Plateforme de fidélisation Horeca

Document de référence — à garder à jour au fil des décisions.

---

## 1. Vision en une phrase

Une plateforme de fidélisation + CRM pour cafés, boulangeries et restaurants, qui ne se contente pas de compter des visites mais qui prouve au restaurateur combien de clients et de chiffre d'affaires elle lui ramène. Lancement à Bruxelles, société incorporée en Pologne.

## 2. Différenciation vs la concurrence

| Concurrent | Ce qu'ils font | Notre angle |
|---|---|---|
| Joyn (BE) | Fidélité digitale, gros réseau | On ne copie pas la carte de points — trop commoditisé |
| Embargo (UK) | CRM + loyalty + ordering | Notre vrai benchmark produit |
| Modules loyalty des POS | Basique, intégré | Menace réelle — d'où l'importance de bien s'intégrer plutôt que d'être un outil isolé |

**Notre pari** : l'attribution de revenu ("cette campagne a ramené X clients, Y€ de CA") est plus vendable qu'un simple système de points, et c'est ce qui justifie un abonnement récurrent plutôt qu'un gadget qu'on annule après 2 mois.

## 3. Produit — vue d'ensemble

Deux faces bien distinctes :

### Côté client final : carte wallet, pas d'app
- Le client scanne un QR une fois → la carte s'ajoute à Apple Wallet ou Google Wallet
- **Aucune app à télécharger, aucun compte à créer**
- La carte affiche en direct : nombre de stamps/points (ex. *"6/10 cafés"*), une barre de progression visuelle, le logo du restaurant, et un QR/barcode à scanner en caisse
- Mise à jour automatique du solde à chaque visite — le client n'a rien à rouvrir, la carte se rafraîchit toute seule sur son téléphone
- Possibilité de notification à l'écran verrouillé : *"Stamp ajouté ! Plus que 2 avant votre café gratuit ☕"*
- Une petite web app (PWA) en complément, comme filet de sécurité pour les téléphones qui gèrent mal les wallet passes, et comme point d'inscription initial

**Exemple concret** : un client entre chez BOUCHE, scanne le QR en caisse la première fois → ajoute la carte à son wallet → à chaque café acheté, le staff scanne son pass → le compteur passe de 3/10 à 4/10 en temps réel, visible immédiatement sur son écran de verrouillage.

### Côté restaurateur : vraie plateforme web
Accessible sur `app.tondomaine.com`, avec compte et mot de passe :
- Liste des clients, qui revient / qui ne revient plus
- Scanner QR utilisable directement depuis le navigateur du téléphone du personnel (caméra web, pas d'app native nécessaire)
- Automatisations et leurs résultats (ex. *"Campagne de réactivation : 34 clients ciblés, 11 revenus, ~290€ de CA attribué"*)
- Paramètres de facturation

## 4. Pricing

| Plan | Prix | Cible | Inclus |
|---|---|---|---|
| Pilote | 0-19€/mois, 60-90 jours | Premiers 5-10 clients | Tout le plan Standard, en échange de feedback + témoignage |
| Standard | 49€/mois | Café/boulangerie indépendant | Points, wallet pass, 1 automatisation (win-back) |
| Growth | 89-99€/mois | Restaurant établi, volume élevé | + anniversaire/VIP, WhatsApp, exports de rapports |

Ne pas ajouter de 3e palier tant qu'un client multi-sites ne le demande pas explicitement.

## 5. Équipe

| Rôle | Personne | Responsabilité |
|---|---|---|
| CTO (toi) | Solo, avec Claude Code | Tout le produit : backend, frontend, sécurité, intégrations |
| Sales/Growth (associé, fondateur Varsobagel) | Terrain | Prospection, démos, relation client, réseau Horeca |

En solo côté technique, la discipline clé : moins de composants mais bien faits, s'appuyer sur des services managés (Supabase, Stripe, Twilio) plutôt que tout construire soi-même, automatiser ce qui peut l'être (CI, tests).

## 6. Stack technique

- **Frontend + Backend** : Next.js 14+ (App Router, TypeScript) — un seul repo
- **Base de données** : Postgres via Supabase (Auth + Row-Level Security inclus)
- **ORM** : Prisma
- **UI** : Tailwind CSS + shadcn/ui
- **Jobs planifiés** : Inngest (automatisations type win-back)
- **SMS / WhatsApp** : Twilio
- **Facturation** : Stripe Billing
- **Hosting** : Vercel (avec ton propre nom de domaine — rien n'indique "Vercel" côté utilisateur, c'est l'infra standard de production pour Next.js, utilisée par Notion, Loom, etc.)
- **Suivi d'erreurs** : Sentry
- **Wallet passes** : `passkit-generator` (Apple) + Google Wallet API (REST/JWT)

## 7. Principe d'architecture le plus important : le journal d'événements

Chaque action (visite, stamp ajouté, campagne envoyée, retour attribué) est enregistrée comme un **événement immuable**, jamais modifié après coup. Le solde de points, le statut "client à risque", et l'attribution de revenu sont tous *calculés* à partir de ce journal, jamais stockés comme un chiffre qu'on modifie directement.

**Pourquoi ça compte** : c'est ce qui rend possible, sans refonte plus tard, de répondre à "combien ce client a-t-il rapporté depuis le début ?" ou "cette campagne a-t-elle vraiment fonctionné ?" — la donnée brute est toujours là pour recalculer.

## 8. Sécurité — les points non négociables

- **Row-Level Security activée dès la première table**, chaque donnée cloisonnée par `establishment_id`
- Auth via Supabase Auth (jamais fait maison), 2FA obligatoire sur le compte admin
- Rate limiting sur les endpoints publics (scan QR, saisie téléphone)
- Vérification de signature sur tous les webhooks externes (Stripe, Twilio)
- Validation stricte des inputs côté serveur (Zod), jamais confiance au frontend
- Clés API en variables d'environnement, jamais commitées dans Git
- Séparation stricte staging / production, jamais de vraies données clients en test
- Backups automatiques quotidiens, testés au moins une fois
- `npm audit` / Dependabot actif dès le premier commit

## 9. Structure de société

- NewCo incorporée en Pologne, vente B2B SaaS vers la Belgique
- **À vérifier avec un comptable/fiscaliste cross-border** (pas un conseil de ma part) : régime de TVA applicable (souvent reverse-charge en B2B intra-UE, à confirmer pour votre cas précis), et si l'activité commerciale régulière en Belgique crée une notion d'établissement stable

## 10. Roadmap résumée

1. Squelette + déploiement (jour 1-2)
2. Fondation multi-tenant + sécurité (semaine 1)
3. Boucle centrale : identification client + points (semaine 2-3)
4. Dashboard restaurateur v1 (semaine 3)
5. Wallet passes Apple + Google (semaine 4)
6. Automatisation win-back + attribution (semaine 5)
7. Facturation Stripe (semaine 6)
8. RGPD, monitoring, premiers pilotes réels (semaine 6+)

*(Détail complet avec tests et validations : voir le fichier `plan-execution-claude-code.md`)*

## 11. Plan de validation terrain (30 jours)

| Semaine | Objectif |
|---|---|
| 1 | 15 entretiens terrain à Bruxelles |
| 2 | 15 entretiens + maquette, top 3 cas d'usage, pricing testé |
| 3 | Signer 5 pilotes |
| 4 | Onboarder les premiers pilotes, premières vraies données |

**Décision go/no-go** : 30 entretiens → 10 intéressés → 5 pilotes → au moins 3 payants. Si le marché refuse même un pilote gratuit simplifié, revoir le positionnement avant d'investir plus de temps de développement.

---

## 12. Liste complète des comptes / outils à créer

### Indispensables dès le départ
| Outil | Usage | Coût |
|---|---|---|
| GitHub | Code, versioning | Gratuit |
| Supabase | Base de données Postgres, Auth, RLS | Gratuit au début, payant selon usage |
| Vercel | Hébergement + déploiement | Gratuit au début |
| Nom de domaine (OVH, Namecheap, ou via Vercel) | Ton URL de marque | ~10-15€/an |
| VS Code + Claude Code | Développement | Déjà en place |

### À ajouter à partir de la Phase 4-6
| Outil | Usage | Coût |
|---|---|---|
| Twilio | SMS + WhatsApp Business API | Pay-as-you-go, prévoir un budget test |
| Compte développeur Apple (99$/an) | Signer les Apple Wallet passes | 99$/an — obligatoire |
| Google Cloud (Wallet API) | Google Wallet passes | Gratuit à activer |
| Stripe | Facturation de tes clients restaurateurs | Gratuit, commission sur transactions |
| Sentry | Suivi d'erreurs en production | Gratuit au début |
| Inngest | Automatisations planifiées | Gratuit au début |

### Optionnel / plus tard
- Dependabot (inclus GitHub, gratuit) — sécurité des dépendances
- Un outil de design (Figma) si tu veux maquetter avant de coder les écrans les plus visibles

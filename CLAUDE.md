@AGENTS.md

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

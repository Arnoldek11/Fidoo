import type { Metadata } from "next";
import { LegalDisclaimer } from "../LegalDisclaimer";

export const metadata: Metadata = { title: "Sous-traitants — Fidoo" };

const SUBPROCESSORS = [
  {
    name: "Supabase",
    role: "Base de données (Postgres), authentification",
    location: "UE (eu-west-1)",
    data: "Toutes les données de l'application (établissements, clients, événements)",
  },
  {
    name: "Vercel",
    role: "Hébergement de l'application web",
    location: "Réseau global (Edge/CDN), fonctions serveur configurables par région",
    data: "Toutes les requêtes transitent par cette infrastructure",
  },
  {
    name: "Twilio",
    role: "Envoi de SMS (campagnes de réactivation)",
    location: "États-Unis",
    data: "Numéro de téléphone et contenu du message, uniquement pour les clients ayant consenti",
  },
  {
    name: "Inngest",
    role: "Exécution de la tâche planifiée nocturne de détection des clients inactifs",
    location: "À confirmer selon la configuration du compte",
    data: "Identifiants techniques nécessaires à l'exécution du job — pas de contenu client persistant chez ce prestataire",
  },
];

export default function SubprocessorsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8 text-sm leading-relaxed">
      <h1 className="text-xl font-semibold">Registre des sous-traitants</h1>
      <LegalDisclaimer />

      <p>
        Liste des prestataires techniques qui traitent des données pour le
        compte de Fidoo. Mise à jour à chaque ajout d&apos;un nouveau
        service (ex. Stripe lors de la mise en place de la facturation).
      </p>

      <div className="space-y-4">
        {SUBPROCESSORS.map((sp) => (
          <div
            key={sp.name}
            className="rounded border border-zinc-300 p-4 dark:border-zinc-700"
          >
            <p className="font-semibold">{sp.name}</p>
            <p className="text-zinc-600 dark:text-zinc-400">{sp.role}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Localisation : {sp.location}
            </p>
            <p className="text-xs text-zinc-500">Données : {sp.data}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

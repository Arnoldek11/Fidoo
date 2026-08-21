import type { Metadata } from "next";
import { LegalDisclaimer } from "../LegalDisclaimer";
import { Card, CardContent } from "@/components/ui/card";

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
    <>
      <h1>Registre des sous-traitants</h1>
      <LegalDisclaimer />

      <p>
        Liste des prestataires techniques qui traitent des données pour le
        compte de Fidoo. Mise à jour à chaque ajout d&apos;un nouveau service
        (ex. Stripe lors de la mise en place de la facturation).
      </p>

      <div className="not-prose space-y-3">
        {SUBPROCESSORS.map((sp) => (
          <Card key={sp.name}>
            <CardContent className="text-sm">
              <p className="font-semibold text-foreground">{sp.name}</p>
              <p className="text-muted-foreground">{sp.role}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Localisation : {sp.location}
              </p>
              <p className="text-xs text-muted-foreground">Données : {sp.data}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

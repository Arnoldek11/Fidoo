import type { Metadata } from "next";
import { LegalDisclaimer } from "../LegalDisclaimer";

export const metadata: Metadata = { title: "Conditions d'utilisation — Fidoo" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8 text-sm leading-relaxed">
      <h1 className="text-xl font-semibold">Conditions d&apos;utilisation</h1>
      <LegalDisclaimer />

      <section className="space-y-2">
        <h2 className="font-semibold">Le service</h2>
        <p>
          Fidoo fournit aux établissements Horeca (cafés, boulangeries,
          restaurants) une plateforme de fidélisation : carte à points
          numérique pour leurs clients, tableau de bord, et automatisations
          de réactivation.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Compte établissement</h2>
        <p>
          Chaque établissement accède à son propre espace, cloisonné des
          autres établissements. Le titulaire du compte est responsable de la
          confidentialité de ses identifiants et de l&apos;exactitude des
          informations qu&apos;il communique à ses clients (notamment sur la
          collecte de consentement).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Client final</h2>
        <p>
          Le client d&apos;un établissement partenaire accède à sa carte de
          fidélité sans création de compte ni mot de passe, via un lien
          personnel. Ce lien ne doit pas être partagé — il donne accès à ses
          propres données de fidélité.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Facturation</h2>
        <p>
          [Section à compléter lors de la mise en place de la facturation —
          plans, période d&apos;essai, résiliation.]
        </p>
      </section>
    </div>
  );
}

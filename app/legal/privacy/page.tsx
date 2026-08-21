import type { Metadata } from "next";
import { LegalDisclaimer } from "../LegalDisclaimer";

export const metadata: Metadata = { title: "Politique de confidentialité — Fidoo" };

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Politique de confidentialité</h1>
      <LegalDisclaimer />

      <section className="space-y-2">
        <h2 className="font-semibold">Qui sommes-nous</h2>
        <p>
          Fidoo est une plateforme de fidélisation pour cafés, boulangeries et
          restaurants. [Raison sociale et adresse à compléter une fois la
          société incorporée.]
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Données collectées</h2>
        <p>
          Lorsque vous êtes inscrit·e au programme de fidélité d&apos;un
          établissement partenaire, nous traitons : votre numéro de
          téléphone, votre nom (facultatif), votre historique de visites et
          de points, et votre consentement (ou non) à recevoir des SMS.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Finalité et base légale</h2>
        <p>
          Le suivi des visites et des points repose sur l&apos;exécution du
          programme de fidélité auquel vous avez adhéré. L&apos;envoi de SMS
          de réactivation repose exclusivement sur votre consentement
          explicite, recueilli au moment de l&apos;inscription — sans ce
          consentement, aucune communication marketing ne vous est envoyée.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Sous-traitants</h2>
        <p>
          Vos données sont hébergées et traitées par des prestataires
          techniques (base de données, envoi de SMS). Le détail est
          disponible sur notre{" "}
          <a href="/legal/subprocessors" className="underline">
            registre des sous-traitants
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Durée de conservation</h2>
        <p>
          Vos données sont conservées tant que vous êtes client actif de
          l&apos;établissement, et supprimées sur simple demande (voir
          ci-dessous).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Vos droits</h2>
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification,
          d&apos;opposition et d&apos;effacement de vos données. Pour exercer
          ce droit, demandez à l&apos;établissement où vous êtes inscrit·e de
          supprimer votre fiche — votre numéro, votre nom et votre
          consentement sont alors définitivement effacés. L&apos;historique
          agrégé de l&apos;établissement (nombre de visites, statistiques)
          reste, mais n&apos;est plus rattaché à votre identité.
        </p>
      </section>
    </>
  );
}

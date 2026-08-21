import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Coffee,
  Users,
  Smartphone,
  ScanLine,
  AlertTriangle,
  Megaphone,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Smartphone,
    title: "Aucune app à télécharger",
    description:
      "Le client scanne un QR une fois, sa carte s'ajoute à Apple ou Google Wallet. Pas de compte, pas de mot de passe.",
  },
  {
    icon: ScanLine,
    title: "Scan en caisse, depuis le navigateur",
    description:
      "Votre personnel scanne directement depuis la caméra du téléphone en caisse — aucune app native à installer côté équipe non plus.",
  },
  {
    icon: AlertTriangle,
    title: "Qui revient, qui décroche",
    description:
      "Le tableau de bord signale automatiquement les clients qui n'ont plus visité depuis 21 jours, avant qu'ils ne soient perdus.",
  },
  {
    icon: Megaphone,
    title: "Réactivation automatique",
    description:
      "Un SMS personnalisé part tout seul vers les clients à risque, et chaque retour est attribué avec un chiffre d'affaires estimé.",
  },
];

const PLANS = [
  {
    name: "Pilote",
    price: "0–19€",
    period: "/mois, 60-90 jours",
    description: "Pour les 5 à 10 premiers établissements, en échange d'un retour d'expérience.",
    features: ["Tout le plan Standard", "Accompagnement direct"],
  },
  {
    name: "Standard",
    price: "49€",
    period: "/mois",
    description: "Café ou boulangerie indépendant.",
    features: ["Points & carte wallet", "1 automatisation (réactivation)"],
    highlighted: true,
  },
  {
    name: "Growth",
    price: "89-99€",
    period: "/mois",
    description: "Restaurant établi, volume élevé.",
    features: ["Tout Standard", "Anniversaire / VIP", "WhatsApp, exports"],
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/10 bg-neutral-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2 font-semibold text-white">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              F
            </span>
            Fidoo
          </a>
          <nav className="hidden items-center gap-6 text-sm text-neutral-300 sm:flex">
            <a href="#fonctionnalites" className="hover:text-white">
              Fonctionnalités
            </a>
            <a href="#tarifs" className="hover:text-white">
              Tarifs
            </a>
          </nav>
          <Button render={<a href="/login" />} variant="secondary">
            Se connecter
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 20% 20%, color-mix(in oklch, var(--primary), transparent 70%), transparent 60%), radial-gradient(500px circle at 85% 30%, color-mix(in oklch, var(--coral), transparent 75%), transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div className="space-y-6">
            <Badge className="bg-white/10 text-white">
              Pour cafés, boulangeries &amp; restaurants
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              La fidélité qui prouve son retour sur investissement
            </h1>
            <p className="max-w-lg text-lg text-neutral-300">
              Fidoo ne se contente pas de compter des visites — elle vous
              montre combien de clients et de chiffre d&apos;affaires elle
              vous ramène. Sans app à faire télécharger à vos clients.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" render={<a href="/login" />}>
                Se connecter
                <ArrowRight />
              </Button>
              <Button size="lg" variant="outline" render={<a href="#fonctionnalites" />}
                className="border-white/20 bg-transparent text-white hover:bg-white/10">
                Voir comment ça marche
              </Button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xs -rotate-3 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Café Exemple
            </p>
            <p className="mt-1 text-lg font-semibold">Marie</p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={
                    i < 6
                      ? "flex aspect-square items-center justify-center rounded-full border-2 border-primary bg-primary/20 text-primary"
                      : "flex aspect-square items-center justify-center rounded-full border-2 border-dashed border-neutral-700 text-neutral-700"
                  }
                >
                  <Coffee className="size-3.5" />
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-neutral-400">
              6 / 10 — plus que 4 avant votre café gratuit
            </p>
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="bg-background py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">
            Un système de fidélité, pas juste une carte à points
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{feature.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="tarifs" className="bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">Tarifs</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlighted ? "border-coral shadow-lg" : undefined}
              >
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{plan.name}</p>
                    {plan.highlighted && (
                      <Badge className="bg-coral text-coral-foreground">
                        Populaire
                      </Badge>
                    )}
                  </div>
                  <p>
                    <span className="text-3xl font-semibold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <ul className="space-y-1.5 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="size-1 rounded-full bg-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t bg-background py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <Users className="size-4" />
            Fidoo — Bruxelles
          </span>
          <div className="flex gap-4">
            <a href="/legal/privacy" className="hover:underline">
              Confidentialité
            </a>
            <a href="/legal/terms" className="hover:underline">
              Conditions
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

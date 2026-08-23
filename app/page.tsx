import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { HeroPreview } from "@/components/landing/hero-preview";
import { BrowserFrame } from "@/components/landing/browser-frame";
import {
  Users,
  Smartphone,
  ScanLine,
  AlertTriangle,
  Megaphone,
  ArrowRight,
  SmartphoneNfc,
  Wallet,
  UserCheck,
  CheckCircle2,
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

const STEPS = [
  { icon: SmartphoneNfc, label: "Le client scanne un QR ou tape son téléphone" },
  { icon: Wallet, label: "Sa carte Wallet s'ouvre instantanément" },
  { icon: UserCheck, label: "Il rejoint votre programme, sans rien installer" },
];

const PLAN_FEATURES = [
  "Carte de fidélité Apple & Google Wallet",
  "QR et NFC pour rejoindre en un tap",
  "Scan en caisse depuis le navigateur",
  "Détection automatique des clients à risque",
  "Réactivation automatique par SMS",
  "Tableau de bord et statistiques",
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Logo className="h-5 w-auto" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#produit" className="hover:text-foreground">
              Produit
            </a>
            <a href="#tarifs" className="hover:text-foreground">
              Tarifs
            </a>
            <a href="#comment-ca-marche" className="hover:text-foreground">
              Pour les restaurants
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button render={<a href="/login" />} variant="outline" size="sm">
              Se connecter
            </Button>
            <Button render={<a href="/login" />} size="sm">
              Essayer gratuitement
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-background">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div className="space-y-6">
            <Badge className="border-transparent bg-primary-tint text-primary">
              Pour cafés, boulangeries &amp; restaurants
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Faites revenir vos clients.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Une carte de fidélité que vos clients gardent dans leur téléphone, et un tableau
              de bord qui vous dit qui revient — sans app à faire télécharger.
            </p>
            <div>
              <Button size="lg" render={<a href="/login" />}>
                Créer mon programme
                <ArrowRight />
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">Aucune carte bancaire requise</p>
            </div>
          </div>

          <HeroPreview />
        </div>
      </section>

      <section className="bg-background pb-20">
        <div className="mx-auto max-w-4xl px-6">
          <BrowserFrame
            src="/landing-dashboard-preview.png"
            alt="Tableau de bord Fidoo : clients fidèles, visites, récompenses et activité en direct"
            width={1440}
            height={900}
          />
        </div>
      </section>

      <section id="produit" className="bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Un système de fidélité, pas juste une carte à points
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              >
                <CardContent className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{feature.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="comment-ca-marche" className="bg-background py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Aussi simple qu&apos;un tap
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                  <step.icon className="size-6" strokeWidth={1.75} />
                </span>
                <p className="text-sm text-foreground">
                  <span className="font-medium">{i + 1}.</span> {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tarifs" className="bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tarifs
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-muted-foreground">
            Un seul plan, tout compris. Pas de paliers compliqués à comparer.
          </p>
          <Card className="mx-auto mt-10 max-w-md border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <CardContent className="space-y-6">
              <div>
                <p className="font-semibold text-foreground">Fidoo</p>
                <p className="mt-1">
                  <span className="text-4xl font-semibold text-foreground">49€</span>
                  <span className="text-muted-foreground"> /mois par établissement</span>
                </p>
              </div>
              <ul className="space-y-2.5 text-sm">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button size="lg" className="w-full" render={<a href="/login" />}>
                Essayer gratuitement
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border bg-background py-8">
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

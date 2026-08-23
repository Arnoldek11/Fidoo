import Link from "next/link";
import { Logo } from "@/components/logo";
import { HeroPreview } from "@/components/landing/hero-preview";
import { BrowserFrame } from "@/components/landing/browser-frame";
import {
  Smartphone,
  ScanLine,
  AlertTriangle,
  Megaphone,
  ArrowRight,
  SmartphoneNfc,
  Wallet,
  UserCheck,
  Check,
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
    <div className="flex min-h-screen flex-col" style={{ background: "#FBF6EF" }}>
      <header className="px-6 pt-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo className="h-5 w-auto" />
          </Link>
          <nav
            className="hidden items-center gap-1 rounded-full bg-white p-1.5 sm:flex"
            style={{ boxShadow: "0 2px 10px rgba(74,64,56,0.06)" }}
          >
            <a href="#produit" className="rounded-full px-4 py-2 text-sm font-semibold text-[#4A4038] hover:text-primary">
              Produit
            </a>
            <a href="#tarifs" className="rounded-full px-4 py-2 text-sm font-semibold text-[#4A4038] hover:text-primary">
              Tarifs
            </a>
            <a href="#comment-ca-marche" className="rounded-full px-4 py-2 text-sm font-semibold text-[#4A4038] hover:text-primary">
              Pour les restaurants
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button href="/login" variant="ghost">
              Se connecter
            </Button>
            <Button href="/login" variant="primary">
              Essayer gratuitement
            </Button>
          </div>
        </div>
      </header>

      <section>
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2"
              style={{ boxShadow: "0 2px 10px rgba(74,64,56,0.06)" }}
            >
              <span className="size-2 shrink-0 rounded-full bg-primary" />
              <span className="text-[13px] font-bold text-[#4A4038]">
                Pour cafés, boulangeries &amp; restaurants
              </span>
            </div>
            <h1 className="font-heading text-4xl leading-[1.05] font-bold tracking-tight text-[#3A322B] sm:text-5xl lg:text-[64px]">
              Faites revenir vos clients.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed font-medium text-[#6B5F52]">
              Une carte de fidélité que vos clients gardent dans leur téléphone, et un tableau
              de bord qui vous dit qui revient — sans app à faire télécharger.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Button href="/login" variant="primary" size="lg">
                Créer mon programme
                <ArrowRight className="size-4" />
              </Button>
              <span className="text-sm font-medium text-[#8A7D6C]">Aucune carte bancaire requise</span>
            </div>
          </div>

          <HeroPreview />
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-4xl px-6">
          <BrowserFrame
            src="/landing-dashboard-preview.png"
            alt="Tableau de bord Fidoo : clients fidèles, visites, récompenses et activité en direct"
            width={1440}
            height={900}
          />
        </div>
      </section>

      <section id="produit" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-heading text-center text-2xl font-bold tracking-tight text-[#3A322B] sm:text-3xl">
            Un système de fidélité, pas juste une carte à points
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="flex gap-4 rounded-[28px] bg-white p-7"
                style={{
                  boxShadow: "0 16px 32px -12px rgba(74,64,56,0.12)",
                  transform: i % 2 === 0 ? "rotate(-0.6deg)" : "rotate(0.6deg)",
                }}
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-tint text-primary">
                  <feature.icon className="size-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-bold text-[#3A322B]">{feature.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#6B5F52]">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="comment-ca-marche" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-heading text-center text-2xl font-bold tracking-tight text-[#3A322B] sm:text-3xl">
            Aussi simple qu&apos;un tap
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.label}
                className="flex flex-col items-center gap-3 rounded-[28px] bg-white px-6 py-8 text-center"
                style={{ boxShadow: "0 16px 32px -12px rgba(74,64,56,0.1)" }}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-tint text-primary">
                  <step.icon className="size-6" strokeWidth={2} />
                </span>
                <p className="text-sm font-semibold text-[#3A322B]">
                  <span className="text-primary">{i + 1}.</span> {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tarifs" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-heading text-center text-2xl font-bold tracking-tight text-[#3A322B] sm:text-3xl">
            Tarifs
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center font-medium text-[#8A7D6C]">
            Un seul plan, tout compris. Pas de paliers compliqués à comparer.
          </p>
          <div
            className="mx-auto mt-10 max-w-md rounded-[28px] bg-white p-8"
            style={{ boxShadow: "0 24px 50px -12px rgba(74,64,56,0.16)" }}
          >
            <p className="font-bold text-[#3A322B]">Fidoo</p>
            <p className="mt-1">
              <span className="font-heading text-4xl font-bold text-[#3A322B]">49€</span>
              <span className="font-medium text-[#8A7D6C]"> /mois par établissement</span>
            </p>
            <ul className="mt-6 space-y-3">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium text-[#3A322B]">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <Button href="/login" variant="primary" size="lg" full>
                Essayer gratuitement
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-sm font-medium text-[#8A7D6C] sm:flex-row">
          <span>fidoo — Bruxelles</span>
          <div className="flex gap-4">
            <a href="/legal/privacy" className="hover:text-primary">
              Confidentialité
            </a>
            <a href="/legal/terms" className="hover:text-primary">
              Conditions
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Button({
  href,
  children,
  variant,
  size = "sm",
  full = false,
}: {
  href: string;
  children: React.ReactNode;
  variant: "primary" | "ghost";
  size?: "sm" | "lg";
  full?: boolean;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition-transform hover:scale-[1.02] ${
        size === "lg" ? "px-7 py-4 text-base" : "px-5 py-2.5 text-sm"
      } ${full ? "w-full" : ""} ${
        variant === "primary" ? "bg-primary text-white" : "bg-white text-[#4A4038]"
      }`}
      style={{
        boxShadow:
          variant === "primary"
            ? "0 10px 24px -4px rgba(255,90,95,0.4)"
            : "0 2px 10px rgba(74,64,56,0.06)",
      }}
    >
      {children}
    </a>
  );
}

import { login } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Merci de renseigner un email et un mot de passe valides.",
  credentials: "Email ou mot de passe incorrect.",
  network: "Connexion lente ou instable — merci de réessayer.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#FBF6EF" }}>
      <Card
        className="w-full max-w-sm rounded-[24px] border-none bg-white"
        style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
      >
        <CardHeader className="items-center text-center">
          <Logo className="mb-3 h-6 w-auto" />
          <CardTitle className="font-heading text-xl font-bold text-[#3A322B]">
            Connexion établissement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-2xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
            </p>
          )}

          <form action={login} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full shadow-[0_8px_18px_rgba(255,90,95,0.32)]"
            >
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

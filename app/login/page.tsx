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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Logo className="mb-3 h-6 w-auto" />
          <CardTitle className="text-xl">Connexion établissement</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
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

            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

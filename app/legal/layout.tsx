export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <a href="/" className="text-sm text-muted-foreground hover:underline">
          ← Fidoo
        </a>
        <div className="prose prose-sm mt-6 max-w-none [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_section]:mt-6 [&_section]:space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

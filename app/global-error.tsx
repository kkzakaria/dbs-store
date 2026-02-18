"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <h2 className="text-lg font-semibold">Une erreur est survenue</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nous rencontrons un probleme technique. Veuillez reessayer.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Reessayer
          </button>
        </div>
      </body>
    </html>
  );
}

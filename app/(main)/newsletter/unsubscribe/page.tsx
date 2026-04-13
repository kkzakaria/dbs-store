import Link from "next/link";
import type { Metadata } from "next";
import { unsubscribeNewsletter } from "@/lib/actions/newsletter";

export const metadata: Metadata = {
  title: "Desinscription newsletter — DBS Store",
  description: "Desinscription de la newsletter DBS Store.",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  let success = false;
  let errorMessage = "";

  if (!token) {
    errorMessage = "Lien de desinscription invalide.";
  } else {
    const result = await unsubscribeNewsletter(token);
    if ("error" in result && result.error) {
      errorMessage = result.error;
    } else {
      success = true;
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      {success ? (
        <>
          <h1 className="text-2xl font-bold">Vous avez ete desinscrit</h1>
          <p className="mt-2 text-muted-foreground">
            Vous ne recevrez plus nos emails. Vous pouvez vous reinscrire a tout moment.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Erreur</h1>
          <p className="mt-2 text-muted-foreground">{errorMessage}</p>
        </>
      )}
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
      >
        Retour a l&apos;accueil
      </Link>
    </div>
  );
}

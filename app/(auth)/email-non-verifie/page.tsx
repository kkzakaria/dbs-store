"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { authClient, signOut } from "@/lib/auth-client";

function maskEmail(e: string) {
  const [local, domain] = e.split("@");
  if (!local || !domain) return e;
  return `${local[0]}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export default function EmailNotVerifiedPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const email = session?.user?.email ?? "";

  async function handleResend() {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      await authClient.emailOtp.sendVerificationOtp(
        { email, type: "email-verification" },
        {
          onError: (ctx) => {
            setError(ctx.error.message ?? "Impossible d'envoyer le code.");
          },
          onSuccess: () => {
            try { sessionStorage.setItem("otp_email", email); } catch { }
            router.push("/verifier-email");
          },
        }
      );
    } catch {
      setError("Impossible d'envoyer le code. Vérifiez votre connexion internet.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/connexion");
  }

  return (
    <AuthCard
      title="Vérifiez votre email"
      description={email ? `Un code de vérification a été envoyé à ${maskEmail(email)}` : "Votre email n'est pas vérifié"}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Votre adresse email n'a pas encore été vérifiée. Accédez à votre boîte mail et entrez le code reçu, ou demandez-en un nouveau.
        </p>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button onClick={handleResend} className="w-full" disabled={loading || !email}>
          {loading ? "Envoi..." : "Renvoyer le code"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-primary hover:underline"
          >
            Se déconnecter
          </button>
        </p>
      </div>
    </AuthCard>
  );
}

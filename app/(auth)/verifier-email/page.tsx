"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { OtpInput } from "@/components/auth/otp-input";
import { authClient } from "@/lib/auth-client";

function maskEmail(e: string) {
  const [local, domain] = e.split("@");
  if (!local || !domain) return e;
  return `${local[0]}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

function VerifyEmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = sessionStorage.getItem("otp_email"); } catch { }
    if (!stored) {
      router.replace("/inscription");
      return;
    }
    setEmail(stored);
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Veuillez saisir le code à 6 chiffres");
      return;
    }
    setLoading(true);
    try {
      await authClient.emailOtp.verifyEmail(
        { email, otp },
        {
          onError: (ctx) => {
            setError(ctx.error.message ?? "Code incorrect ou expiré. Réessayez.");
          },
          onSuccess: () => {
            try { sessionStorage.removeItem("otp_email"); } catch { }
            router.push("/");
          },
        }
      );
    } catch {
      setError("Impossible de vérifier le code. Vérifiez votre connexion internet.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || !email) return;
    try {
      await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
      setResendCooldown(60);
    } catch {
      setError("Impossible d'envoyer le code. Vérifiez votre connexion internet.");
    }
  }

  return (
    <AuthCard
      title="Vérifiez votre email"
      description={email ? `Code envoyé à ${maskEmail(email)}` : "Chargement..."}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Entrez le code à 6 chiffres reçu par email
          </p>
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
          {loading ? "Vérification..." : "Vérifier mon email"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Vous n'avez pas reçu le code ?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : "Renvoyer le code"}
        </button>
      </p>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}

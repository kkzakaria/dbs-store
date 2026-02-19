"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordToggle } from "@/components/auth/password-toggle";
import { authClient } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-utils";

function ResetPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("otp_email");
    if (!stored) {
      router.push("/mot-de-passe-oublie");
      return;
    }
    setEmail(stored);
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleResend() {
    if (resendCooldown > 0 || !email) return;
    try {
      await authClient.emailOtp.sendVerificationOtp(
        { email, type: "forget-password" },
        {
          onError: (ctx) => {
            setError(translateAuthError(ctx.error.message, "Impossible d'envoyer le code."));
          },
          onSuccess: () => {
            setResendCooldown(60);
          },
        }
      );
    } catch {
      setError("Impossible d'envoyer le code. Vérifiez votre connexion internet.");
    }
  }

  function maskEmail(e: string) {
    const [local, domain] = e.split("@");
    if (!local || !domain) return e;
    return `${local[0]}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (otp.length !== 6) {
      setError("Veuillez saisir le code à 6 chiffres");
      return;
    }

    setLoading(true);

    try {
      await authClient.emailOtp.resetPassword(
        { email, otp, password },
        {
          onError: (ctx) => {
            setError(translateAuthError(ctx.error.message, "Code incorrect ou expiré."));
          },
          onSuccess: () => {
            sessionStorage.removeItem("otp_email");
            router.push("/connexion");
          },
        }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Réinitialiser le mot de passe"
      description={email ? `Code envoyé à ${maskEmail(email)}` : "Chargement..."}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Entrez le code à 6 chiffres reçu par email
          </p>
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <PasswordToggle
                type={showPassword ? "text" : "password"}
                onToggle={() => setShowPassword((v) => !v)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Réinitialisation..." : "Réinitialiser"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

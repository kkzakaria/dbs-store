"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AuthCard } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";
import { PasswordToggle } from "@/components/auth/password-toggle";
import { PasswordStrength } from "@/components/auth/password-strength";
import { signUp, authClient } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-utils";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signUp.email(
        { name, email, password },
        {
          onError: (ctx) => {
            setError(translateAuthError(ctx.error.message, "Une erreur est survenue."));
          },
          onSuccess: async () => {
            try {
              await authClient.emailOtp.sendVerificationOtp({
                email,
                type: "email-verification",
              });
            } catch {
              // Silent — user can resend from /email-non-verifie
            }
            try { sessionStorage.setItem("otp_email", email); } catch { }
            router.push("/verifier-email");
          },
        }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Créer un compte"
      description="Inscrivez-vous pour commencer vos achats"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom complet</Label>
          <Input
            id="name"
            type="text"
            placeholder="Votre nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
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
          <PasswordStrength password={password} />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Inscription..." : "S'inscrire"}
        </Button>
      </form>

      <div className="relative my-4">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
          ou
        </span>
      </div>

      <SocialButtons />

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthCard>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authClient.forgetPassword(
        { email, redirectTo: "/reinitialiser" },
        {
          onError: (ctx) => {
            setError(ctx.error.message ?? "Une erreur est survenue");
          },
          onSuccess: () => {
            setSent(true);
          },
        }
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthCard
        title="Email envoyé"
        description="Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation."
      >
        <Link
          href="/connexion"
          className="text-sm text-primary hover:underline"
        >
          Retour à la connexion
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Entrez votre email pour recevoir un lien de réinitialisation"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Envoi..." : "Envoyer le lien"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/connexion" className="text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </AuthCard>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

const providers = [
  { id: "google" as const, label: "Google" },
  { id: "facebook" as const, label: "Facebook" },
  { id: "apple" as const, label: "Apple" },
];

interface SocialButtonsProps {
  callbackURL?: string;
}

export function SocialButtons({ callbackURL = "/" }: SocialButtonsProps) {
  const [error, setError] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  async function handleSocialSignIn(providerId: "google" | "facebook" | "apple") {
    setError("");
    setLoadingProvider(providerId);

    try {
      await signIn.social(
        { provider: providerId, callbackURL },
        {
          onError: (ctx) => {
            setError(ctx.error.message ?? "Une erreur est survenue");
            setLoadingProvider(null);
          },
        }
      );
    } catch {
      setError("Impossible de se connecter. Vérifiez votre connexion internet.");
      setLoadingProvider(null);
    }
  }

  return (
    <div className="grid gap-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          className="w-full"
          disabled={loadingProvider !== null}
          onClick={() => handleSocialSignIn(provider.id)}
        >
          {loadingProvider === provider.id ? "Connexion..." : provider.label}
        </Button>
      ))}
    </div>
  );
}

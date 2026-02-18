"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

const providers = [
  { id: "google" as const, label: "Google" },
  { id: "facebook" as const, label: "Facebook" },
  { id: "apple" as const, label: "Apple" },
];

export function SocialButtons() {
  return (
    <div className="grid gap-2">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          className="w-full"
          onClick={() =>
            signIn.social({ provider: provider.id, callbackURL: "/" })
          }
        >
          {provider.label}
        </Button>
      ))}
    </div>
  );
}

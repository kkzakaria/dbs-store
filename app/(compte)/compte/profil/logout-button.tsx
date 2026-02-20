"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/connexion");
          router.refresh();
        },
      },
    });
    setLoading(false);
  }

  return (
    <Button variant="destructive" onClick={handleLogout} disabled={loading}>
      {loading ? "Déconnexion..." : "Se déconnecter"}
    </Button>
  );
}

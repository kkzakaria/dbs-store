"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, ShoppingBag, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "@/lib/auth-client";

export function UserMenu() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } finally {
      router.push("/");
      router.refresh();
    }
  }, [router]);

  if (isPending) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Compte">
        <User className="size-5" />
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Button variant="ghost" size="icon" asChild>
        <Link href="/connexion" aria-label="Compte">
          <User className="size-5" />
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Compte">
          <User className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block text-sm font-medium">{session.user.name}</span>
          <span className="block text-xs text-muted-foreground">{session.user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/compte">
              <Settings className="mr-2 size-4" />
              Mon compte
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/compte/commandes">
              <ShoppingBag className="mr-2 size-4" />
              Mes commandes
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 size-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

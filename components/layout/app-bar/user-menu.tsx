import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  return (
    <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
      <Link href="/connexion" aria-label="Compte">
        <User className="size-5" />
      </Link>
    </Button>
  );
}

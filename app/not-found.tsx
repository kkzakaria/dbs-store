import Image from "next/image";
import Link from "next/link";
import { PackageX, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/50 px-4 text-center">
      <Image
        src="/images/dbs-store-logo.png"
        alt="DBS Store"
        width={140}
        height={36}
        className="h-9 w-auto"
      />
      <div className="flex size-20 items-center justify-center rounded-full bg-white shadow-md">
        <PackageX className="size-9 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Page introuvable</h1>
        <p className="max-w-xs text-muted-foreground">
          Ce lien ne mène nulle part ou la page a été déplacée.
        </p>
      </div>
      <Button asChild>
        <Link href="/">
          <Home className="mr-2 size-4" />
          Retour à l&apos;accueil
        </Link>
      </Button>
      <span className="text-xs text-muted-foreground/50">ERREUR 404</span>
    </div>
  );
}

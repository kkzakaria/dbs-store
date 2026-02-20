import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const nav = [
  { label: "Mes commandes", href: "/compte/commandes" },
  { label: "Mon profil", href: "/compte/profil" },
];

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/connexion?callbackUrl=/compte/commandes");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
      <h1 className="text-xl font-bold">Mon compte</h1>
      <p className="mt-1 text-sm text-muted-foreground">{session.user.email}</p>
      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <nav className="flex gap-2 lg:w-48 lg:flex-col">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/session";
import { CompteNav } from "@/components/compte/compte-nav";

export const dynamic = "force-dynamic";

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedSession();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte/commandes");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <CompteNav />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

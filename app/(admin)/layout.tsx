import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { Sidebar } from "@/components/admin/sidebar";

export const dynamic = "force-dynamic";

export const metadata = { title: "Administration — DBS Store" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/connexion?callbackUrl=/admin");
  }

  // Verifier l'appartenance a l'organisation
  let isOrgMember = false;
  try {
    const orgs = await auth.api.listOrganizations({ headers: await headers() });
    isOrgMember = Array.isArray(orgs) && orgs.length > 0;
  } catch {
    isOrgMember = false;
  }

  if (!isOrgMember) {
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={session.user.email} />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
    </div>
  );
}

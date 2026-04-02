import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { TeamManagement } from "@/components/admin/team-management";

export const dynamic = "force-dynamic";

export default async function AdminEquipePage() {
  const auth = await getAuth();
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });

  let members: Array<{
    id: string;
    userId: string;
    role: string;
    user: { email: string; name: string };
  }> = [];
  let isOwner = false;

  try {
    const fullOrg = await auth.api.getFullOrganization({
      query: { organizationSlug: "dbs-store" },
      headers: h,
    });
    members = fullOrg?.members ?? [];
    const me = members.find((m) => m.userId === session?.user.id);
    isOwner = me?.role === "owner";
  } catch {
    members = [];
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Équipe</h1>
      <TeamManagement members={members} isOwner={isOwner} />
    </div>
  );
}

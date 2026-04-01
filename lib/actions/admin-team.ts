"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

async function requireOwner() {
  const auth = await getAuth();
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const orgs = await auth.api.listOrganizations({ headers: h });
  if (!Array.isArray(orgs) || orgs.length === 0) throw new Error("UNAUTHORIZED");

  // Verifier le role owner via Better Auth
  const fullOrg = await auth.api.getFullOrganization({
    query: { organizationSlug: "dbs-store" },
    headers: h,
  });
  const currentMember = fullOrg?.members?.find(
    (m: { userId: string }) => m.userId === session.user.id
  );
  if (currentMember?.role !== "owner") throw new Error("FORBIDDEN");

  return { session, orgId: orgs[0].id };
}

export async function inviteMember(
  email: string,
  role: "admin" | "member"
): Promise<{ error?: string }> {
  try {
    const auth = await getAuth();
    const h = await headers();
    const { orgId } = await requireOwner();
    await auth.api.createInvitation({
      body: { email, role, organizationId: orgId },
      headers: h,
    });
    revalidatePath("/admin/equipe");
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") return { error: "Acces refuse" };
    return { error: "Erreur lors de l'invitation" };
  }
}

export async function updateMemberRole(
  memberId: string,
  role: "admin" | "member"
): Promise<{ error?: string }> {
  try {
    const auth = await getAuth();
    const h = await headers();
    await requireOwner();
    await auth.api.updateMemberRole({
      body: { memberId, role },
      headers: h,
    });
    revalidatePath("/admin/equipe");
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") return { error: "Acces refuse" };
    return { error: "Erreur lors de la mise a jour du role" };
  }
}

export async function removeMember(memberId: string): Promise<{ error?: string }> {
  try {
    const auth = await getAuth();
    const h = await headers();
    await requireOwner();
    await auth.api.removeMember({
      body: { memberIdOrEmail: memberId },
      headers: h,
    });
    revalidatePath("/admin/equipe");
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") return { error: "Acces refuse" };
    return { error: "Erreur lors de la suppression" };
  }
}

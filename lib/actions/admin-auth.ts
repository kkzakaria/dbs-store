import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requireOrgMember() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const orgs = await auth.api.listOrganizations({ headers: h });
  if (!Array.isArray(orgs) || orgs.length === 0) throw new Error("UNAUTHORIZED");
  return session;
}

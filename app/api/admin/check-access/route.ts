import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ isAdmin: false });
  }
  try {
    const orgs = await auth.api.listOrganizations({ headers: await headers() });
    return NextResponse.json({ isAdmin: Array.isArray(orgs) && orgs.length > 0 });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}

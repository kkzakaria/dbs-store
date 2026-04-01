import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();
  if (!email || !otp) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const db = await getDb();
  const row = await db.get<{ value: string; expiresAt: string }>(
    sql`SELECT value, "expiresAt" FROM verification WHERE identifier = ${`forget-password-otp-${email}`} LIMIT 1`
  );

  if (!row) return NextResponse.json({ valid: false, reason: "not_found" });
  if (new Date(row.expiresAt) < new Date()) return NextResponse.json({ valid: false, reason: "expired" });

  const storedOtp = row.value.split(":")[0];
  if (storedOtp !== otp) return NextResponse.json({ valid: false, reason: "invalid" });

  return NextResponse.json({ valid: true });
}

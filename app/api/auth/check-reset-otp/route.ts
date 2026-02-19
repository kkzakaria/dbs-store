import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();
  if (!email || !otp) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const db = new Database(process.env.DATABASE_URL || "./dev.db", { readonly: true });
  try {
    const row = db
      .prepare("SELECT value, expiresAt FROM verification WHERE identifier = ?")
      .get(`forget-password-otp-${email}`) as { value: string; expiresAt: string } | undefined;

    if (!row) return NextResponse.json({ valid: false, reason: "not_found" });
    if (new Date(row.expiresAt) < new Date()) return NextResponse.json({ valid: false, reason: "expired" });

    const storedOtp = row.value.split(":")[0];
    if (storedOtp !== otp) return NextResponse.json({ valid: false, reason: "invalid" });

    return NextResponse.json({ valid: true });
  } finally {
    db.close();
  }
}

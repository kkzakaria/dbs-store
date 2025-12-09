import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure user profile exists in public.users table
      await supabaseAdmin.from("users").upsert(
        {
          id: data.user.id,
          email: data.user.email,
          full_name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split("@")[0] ||
            "Utilisateur",
          role: "customer" as const,
        },
        { onConflict: "id" }
      )

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirect to home on failure (since we removed /login page)
  return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
}

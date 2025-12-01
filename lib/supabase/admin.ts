import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Admin client with service role key - bypasses RLS
// WARNING: Only use server-side, never expose to client
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

import { cache } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Deduplicated session fetch for React Server Components.
 *
 * React.cache() ensures at most one auth.api.getSession() call per server
 * request, regardless of how many RSC components (layout + pages) invoke it.
 * No args → cache key is stable within a single request.
 *
 * Server-only: this file must never be imported by client components.
 */
export const getCachedSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

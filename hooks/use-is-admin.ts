"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

export function useIsAdmin(): boolean {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      return;
    }
    let cancelled = false;
    fetch("/api/admin/check-access")
      .then((r) => r.json())
      .then((data: { isAdmin: boolean }) => {
        if (!cancelled) setIsAdmin(data.isAdmin);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- session?.user is an unstable object ref; use .id (primitive) to avoid re-fetching on every render
  }, [session?.user?.id]);

  // When there is no session, derive false without a setState call
  return session?.user ? isAdmin : false;
}

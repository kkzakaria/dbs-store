"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

export function useIsAdmin(): boolean {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false);
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
  }, [session?.user]);

  return isAdmin;
}

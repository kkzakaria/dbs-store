"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as AuthUser } from "@supabase/supabase-js";
import type { User } from "@/types";

interface UseUserReturn {
  user: User | null;
  authUser: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  const fetchUserProfile = useCallback(
    async (authUser: AuthUser) => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (error) {
          // User might not exist in public.users yet (new signup)
          if (error.code === "PGRST116") {
            setUser(null);
            return;
          }
          throw error;
        }

        setUser(data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to fetch user"),
        );
      }
    },
    [supabase],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      // Handle AuthSessionMissingError - this is expected when not logged in
      if (authError) {
        // Check if it's an "Auth session missing" error - treat as logged out, not an error
        if (
          authError.name === "AuthSessionMissingError" ||
          authError.message?.includes("session") ||
          authError.message?.includes("Auth session missing")
        ) {
          setAuthUser(null);
          setUser(null);
          return;
        }
        throw authError;
      }

      if (authUser) {
        setAuthUser(authUser);
        await fetchUserProfile(authUser);
      } else {
        setAuthUser(null);
        setUser(null);
      }
    } catch (err) {
      console.error("Error refreshing user:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to refresh user"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchUserProfile]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setAuthUser(null);
      setUser(null);
    } catch (err) {
      console.error("Error signing out:", err);
      setError(err instanceof Error ? err : new Error("Failed to sign out"));
    }
  }, [supabase]);

  useEffect(() => {
    // Initial fetch
    refresh();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setAuthUser(session.user);
        await fetchUserProfile(session.user);
        setIsLoading(false);
      } else if (event === "SIGNED_OUT") {
        setAuthUser(null);
        setUser(null);
        setIsLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setAuthUser(session.user);
        setIsLoading(false);
      } else if (event === "USER_UPDATED" && session?.user) {
        setAuthUser(session.user);
        await fetchUserProfile(session.user);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refresh, fetchUserProfile]);

  return {
    user,
    authUser,
    isLoading,
    error,
    refresh,
    signOut,
  };
}

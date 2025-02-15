'use client';

import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Ulid } from "@/utils/types/auth";

interface UseAuthReturn {
  isLoading: boolean;
  isSignedIn: boolean | null;
  userId: string | null;
  userUlid: Ulid | null;
  error: Error | null;
}

export function useAuth(): UseAuthReturn {
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const [userUlid, setUserUlid] = useState<Ulid | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUserUlid() {
      if (!userId) {
        setUserUlid(null);
        return;
      }

      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from('User')
          .select('ulid')
          .eq('userId', userId)
          .single();

        if (error) throw error;
        if (data?.ulid) setUserUlid(data.ulid as Ulid);
      } catch (e) {
        console.error('[AUTH_ERROR] Failed to fetch user ULID:', e);
        setError(e instanceof Error ? e : new Error('Failed to fetch user ULID'));
      }
    }

    fetchUserUlid();
  }, [userId]);

  return {
    isLoading: !isLoaded,
    isSignedIn: isSignedIn ?? null,
    userId: userId ?? null,
    userUlid,
    error,
  };
}
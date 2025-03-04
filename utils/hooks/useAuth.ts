'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth/auth-client';
import type { Ulid } from '@/utils/types/auth';
import { SystemRole, UserCapability } from '@/utils/roles/roles';

interface UseAuthReturn {
  isLoading: boolean;
  isSignedIn: boolean | null;
  userId: string | null;
  userUlid: Ulid | null;
  systemRole: SystemRole | null;
  capabilities: UserCapability[];
  error: Error | null;
}

export function useAuth(): UseAuthReturn {
  const { isLoaded, isSignedIn, user } = useUser();
  const [userUlid, setUserUlid] = useState<Ulid | null>(null);
  const [systemRole, setSystemRole] = useState<SystemRole | null>(null);
  const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!isLoaded || !isSignedIn || !user?.id) return;

      try {
        const supabase = await createAuthClient();
        const { data, error: dbError } = await supabase
          .from('User')
          .select('ulid, systemRole, capabilities')
          .eq('userId', user.id)
          .single();

        if (dbError) throw dbError;

        if (data) {
          setUserUlid(data.ulid);
          setSystemRole(data.systemRole);
          setCapabilities(data.capabilities || []);
        }
      } catch (err) {
        console.error('[AUTH_ERROR] Failed to fetch user data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
      }
    }

    fetchUserData();
  }, [isLoaded, isSignedIn, user?.id]);

  return {
    isLoading: !isLoaded,
    isSignedIn: isSignedIn || false,
    userId: user?.id || null,
    userUlid,
    systemRole,
    capabilities,
    error,
  };
}
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";
import { AuthProviders } from "@/components/auth/providers";
import { useAuth } from "@clerk/nextjs";
import { SYSTEM_ROLES } from "@/utils/roles/roles";
import type { AuthContext } from "@/utils/types/auth";

export default function Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }));

  // Default initial state when not authenticated
  const initialState: AuthContext = {
    userId: '',
    userUlid: '',
    systemRole: SYSTEM_ROLES.USER,
    capabilities: []
  };

  return (
    <AuthProviders initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        {children}
      </QueryClientProvider>
    </AuthProviders>
  );
}

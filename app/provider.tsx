"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";
import { OrganizationProvider } from "@/utils/auth/OrganizationContext";

export default function Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider>
        <ReactQueryDevtools initialIsOpen={false} />
        {children}
      </OrganizationProvider>
    </QueryClientProvider>
  );
}

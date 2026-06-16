'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AuthProvider } from '@/components/auth-provider';
import { ToastProvider } from '@/components/toast-provider';

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000
          }
        }
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

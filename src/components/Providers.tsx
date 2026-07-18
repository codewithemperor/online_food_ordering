'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 60 * 1000, retry: 1 },
    },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#1f2937', color: '#f9fafb', borderRadius: '0.75rem' },
            success: { iconTheme: { primary: '#f97316', secondary: '#ffffff' } },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary, ThemeProvider, NotificationProvider } from '@aviary-ui/ui';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s — cached data considered fresh; no refetch on revisit
      retry: 1,          // retry failed requests once before showing error
    },
  },
});

// Shared provider shell. The router (PublicRouter or AdminRouter) is passed as
// children by the entry point — the two apps ship as separate Vite bundles.
export default function App({ children }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

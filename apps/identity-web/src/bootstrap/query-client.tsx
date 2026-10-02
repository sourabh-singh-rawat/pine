import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { isAxiosError } from "axios";
import type { PropsWithChildren } from "react";

const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  const isClientError =
    isAxiosError(error) &&
    typeof error.response?.status === "number" &&
    error.response.status >= 400 &&
    error.response.status < 500;

  if (isClientError) {
    return false;
  }

  return failureCount < 1;
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
        throwOnError: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });

const queryClient = createQueryClient();

export const AppQueryProvider = ({ children }: Readonly<PropsWithChildren>) => (
  <QueryClientProvider client={queryClient}>
    {children}
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);

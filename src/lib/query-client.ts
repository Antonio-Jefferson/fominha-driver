import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // Não adianta repetir um 4xx — o servidor já decidiu.
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

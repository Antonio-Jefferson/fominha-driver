import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptOffer, declineOffer, listOffers } from "../api/deliveries";

/** Segundos até `expiresAt`, nunca negativo. */
export function secondsUntil(expiresAt: string, now: Date = new Date()): number {
  const diffMs = new Date(expiresAt).getTime() - now.getTime();
  return Math.max(0, Math.round(diffMs / 1000));
}

export function useOffers(enabled: boolean) {
  const queryClient = useQueryClient();
  const [, forceTick] = useState(0);

  const query = useQuery({
    queryKey: ["driver-offers"],
    queryFn: listOffers,
    enabled,
    refetchInterval: enabled ? 5_000 : false,
  });

  // Re-renderiza a cada segundo só pra atualizar o texto da contagem
  // regressiva — os dados em si vêm do refetch de 5 em 5s acima.
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => forceTick((t) => t + 1), 1_000);
    return () => clearInterval(interval);
  }, [enabled]);

  async function accept(offerId: string) {
    await acceptOffer(offerId);
    await queryClient.invalidateQueries({ queryKey: ["driver-offers"] });
    await queryClient.invalidateQueries({ queryKey: ["active-delivery"] });
  }

  async function decline(offerId: string) {
    await declineOffer(offerId);
    await queryClient.invalidateQueries({ queryKey: ["driver-offers"] });
  }

  return {
    offers: query.data ?? [],
    isLoading: query.isLoading,
    accept,
    decline,
  };
}

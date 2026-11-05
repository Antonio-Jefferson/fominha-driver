import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getActiveDelivery } from "../api/deliveries";
import { startDeliveryTracking, stopDeliveryTracking } from "./deliveryLocationTask";

/**
 * GPS da entrega. Mora na raiz do app porque a home é desmontada ao abrir a
 * tela da entrega (`router.replace`), e com ela iria embora qualquer rastreio.
 */
export function useDeliveryLocation(enabled: boolean): void {
  const { data } = useQuery({
    queryKey: ["active-delivery"],
    queryFn: getActiveDelivery,
    enabled,
    refetchInterval: 10_000,
  });
  const hasActiveDelivery = enabled && Boolean(data);

  useEffect(() => {
    const action = hasActiveDelivery ? startDeliveryTracking : stopDeliveryTracking;
    action().catch((error: unknown) => {
      // Sem GPS não dá para corrigir daqui, mas o erro não pode sumir: quem
      // depura o rastreio precisa ver por que ele não ligou ou não desligou.
      console.warn("[rastreio da entrega]", error);
    });
  }, [hasActiveDelivery]);
}

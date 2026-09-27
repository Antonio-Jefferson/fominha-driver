import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { updateLocation } from "../api/deliveries";

export function shouldTrack(input: { online: boolean; hasActiveDelivery: boolean }): boolean {
  return input.online || input.hasActiveDelivery;
}

/**
 * Enquanto `online` ou com entrega ativa, pede permissão de localização
 * (só "enquanto o app é usado" — sem rastreio em segundo plano nesta fase)
 * e envia a posição pro backend a cada atualização relevante do GPS.
 */
export function useLocationTracking(input: { online: boolean; hasActiveDelivery: boolean }): void {
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!shouldTrack(input)) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10_000,
          distanceInterval: 30,
        },
        (position) => {
          void updateLocation(position.coords.latitude, position.coords.longitude);
        }
      );
    }

    void start();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [input.online, input.hasActiveDelivery]);
}

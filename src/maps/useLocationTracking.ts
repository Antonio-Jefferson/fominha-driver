import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { updateLocation } from "../api/deliveries";

export function shouldTrack(input: { online: boolean; hasActiveDelivery: boolean }): boolean {
  return input.online && !input.hasActiveDelivery;
}

/**
 * Online e sem entrega: envia a posição só com o app aberto, para receber
 * ofertas próximas. Durante a entrega quem cuida é `useDeliveryLocation`.
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

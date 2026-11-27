import { useEffect, useRef, useState } from "react";

export type LatLng = { latitude: number; longitude: number };

const FRAME_MS = 120;
/** Salto maior que isso (uns 1,5 km) não é movimento: o pino vai direto. */
const TELEPORT_DEGREES = 0.015;

export function interpolate(from: LatLng, to: LatLng, progress: number): LatLng {
  const t = Math.min(1, Math.max(0, progress));
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * t,
    longitude: from.longitude + (to.longitude - from.longitude) * t,
  };
}

export function isTeleport(from: LatLng, to: LatLng): boolean {
  return (
    Math.abs(from.latitude - to.latitude) > TELEPORT_DEGREES ||
    Math.abs(from.longitude - to.longitude) > TELEPORT_DEGREES
  );
}

/**
 * A posição chega a cada ~10 s. Em vez de pular, o pino anda até o novo ponto
 * nesse intervalo, partindo de onde está agora na tela.
 */
export function useAnimatedPosition(target: LatLng | null, durationMs = 10_000): LatLng | null {
  const [position, setPosition] = useState<LatLng | null>(target);
  const currentRef = useRef<LatLng | null>(target);

  const latitude = target?.latitude;
  const longitude = target?.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) {
      currentRef.current = null;
      setPosition(null);
      return;
    }
    const to = { latitude, longitude };
    const from = currentRef.current;
    if (!from || isTeleport(from, to)) {
      currentRef.current = to;
      setPosition(to);
      return;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const progress = (Date.now() - startedAt) / durationMs;
      const next = interpolate(from, to, progress);
      currentRef.current = next;
      setPosition(next);
      if (progress >= 1) clearInterval(timer);
    }, FRAME_MS);
    return () => clearInterval(timer);
  }, [latitude, longitude, durationMs]);

  return position;
}

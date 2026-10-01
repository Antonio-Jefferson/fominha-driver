import { decodePolyline } from "./decodePolyline";
import type { Coordinates } from "./geocodeAddress";

export type Route = {
  points: Coordinates[];
  distanceText: string;
  durationText: string;
};

/**
 * Busca a rota entre dois pontos via Google Directions API. Só uma prévia
 * visual (sem reroteamento automático) — a navegação turn-by-turn de
 * verdade acontece no app do Google Maps (ver Task 14).
 */
export async function getRoute(
  origin: Coordinates,
  destination: Coordinates,
  apiKey: string
): Promise<Route | null> {
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`
    );
    const data = (await res.json()) as {
      status: string;
      routes: Array<{
        overview_polyline: { points: string };
        legs: Array<{ distance: { text: string }; duration: { text: string } }>;
      }>;
    };

    if (data.status !== "OK" || data.routes.length === 0) return null;

    const route = data.routes[0];
    return {
      points: decodePolyline(route.overview_polyline.points),
      distanceText: route.legs[0].distance.text,
      durationText: route.legs[0].duration.text,
    };
  } catch {
    return null;
  }
}

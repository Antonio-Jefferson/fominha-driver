/** Perto disso, "1 min · 0 m" não diz nada: o entregador já está lá. */
const ARRIVED_METERS = 30;

/** "4 min · 1,2 km". Abaixo de um minuto não promete segundos. */
export function routeSummary(route: { distance_meters: number; duration_seconds: number }): string {
  if (route.distance_meters < ARRIVED_METERS) return "Chegando";
  const minutes = Math.max(1, Math.round(route.duration_seconds / 60));
  const distance =
    route.distance_meters < 1000
      ? `${Math.round(route.distance_meters / 10) * 10} m`
      : `${(route.distance_meters / 1000).toFixed(1).replace(".", ",")} km`;
  return `${minutes} min · ${distance}`;
}

export type Coordinates = { latitude: number; longitude: number };

export type GeocodableAddress = {
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
};

function buildQuery(address: GeocodableAddress): string {
  return [
    [address.street, address.number].filter(Boolean).join(", "),
    address.district,
    address.city,
    address.state,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * Geocodifica um endereço em texto livre pra lat/lng via Google Geocoding
 * API. Nunca lança — endereço incompleto ou falha de rede viram `null`, e
 * quem chama decide o que fazer sem endereço geocodificado (ex.: esconder
 * o mapa e mostrar só o endereço em texto).
 */
export async function geocodeAddress(
  address: GeocodableAddress,
  apiKey: string
): Promise<Coordinates | null> {
  const query = buildQuery(address);
  if (!query || !apiKey) return null;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${apiKey}`
    );
    const data = (await res.json()) as {
      status: string;
      results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
    };

    if (data.status !== "OK" || data.results.length === 0) return null;

    const { lat, lng } = data.results[0].geometry.location;
    return { latitude: lat, longitude: lng };
  } catch {
    return null;
  }
}

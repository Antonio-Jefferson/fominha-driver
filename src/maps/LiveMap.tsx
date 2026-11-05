import { useMemo, type ReactElement } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  Marker,
} from "@maplibre/maplibre-react-native";
import { useAnimatedPosition, type LatLng } from "./animatedPosition";

/** OpenFreeMap: dados do OpenStreetMap, sem chave. O crédito aparece no próprio mapa. */
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const DEFAULT_PADDING = { top: 72, right: 56, bottom: 72, left: 56 };
const SINGLE_POINT_ZOOM = 15;
const MAX_ZOOM = 16.5;

export function boundsOf(points: LatLng[]): [number, number, number, number] {
  const longitudes = points.map((p) => p.longitude);
  const latitudes = points.map((p) => p.latitude);
  return [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes),
  ];
}

const lngLat = (p: LatLng): [number, number] => [p.longitude, p.latitude];

/**
 * Mapa da entrega: quem se move, para onde vai e por onde. Funciona com
 * qualquer parte faltando: sem rota mostra só os pinos.
 */
export function LiveMap({
  courier,
  destination,
  origin,
  route,
  routeColor,
  courierMarker,
  destinationMarker,
  originMarker,
  padding = DEFAULT_PADDING,
  style,
  testID,
}: {
  courier?: LatLng | null;
  destination?: LatLng | null;
  origin?: LatLng | null;
  route?: { coordinates: [number, number][] } | null;
  routeColor: string;
  courierMarker: ReactElement;
  destinationMarker: ReactElement;
  originMarker?: ReactElement;
  padding?: { top: number; right: number; bottom: number; left: number };
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const animatedCourier = useAnimatedPosition(courier ?? null);

  // A câmera só anda quando chega posição nova, nunca a cada quadro do pino.
  // A rota entra no quadro: ela pode fazer curva para fora da reta até o destino.
  const framed = [
    ...([courier, destination].filter(Boolean) as LatLng[]),
    ...(route?.coordinates ?? []).map(([longitude, latitude]) => ({ latitude, longitude })),
  ];
  const frameKey = framed.map((p) => `${p.latitude},${p.longitude}`).join(";");
  const camera = useMemo(() => {
    if (framed.length === 0) return null;
    if (framed.length === 1) return { center: lngLat(framed[0]), zoom: SINGLE_POINT_ZOOM };
    return { bounds: boundsOf(framed), padding };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey]);

  const line = useMemo<GeoJSON.Feature | null>(
    () =>
      route && route.coordinates.length >= 2
        ? {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: route.coordinates },
          }
        : null,
    [route]
  );

  return (
    <MapLibreMap testID={testID} style={style} mapStyle={MAP_STYLE_URL} compass={false} logo={false} attributionPosition={{ top: 8, right: 8 }}>
      {camera ? <Camera {...camera} maxZoom={MAX_ZOOM} duration={1000} easing="ease" /> : null}
      {line ? (
        <GeoJSONSource id="delivery-route" data={line}>
          <Layer
            id="delivery-route-line"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{ "line-color": routeColor, "line-width": 5 }}
          />
        </GeoJSONSource>
      ) : null}
      {origin && originMarker ? (
        <Marker id="origin" lngLat={lngLat(origin)}>
          {originMarker}
        </Marker>
      ) : null}
      {destination ? (
        <Marker id="destination" lngLat={lngLat(destination)} anchor="bottom">
          {destinationMarker}
        </Marker>
      ) : null}
      {animatedCourier ? (
        <Marker id="courier" lngLat={lngLat(animatedCourier)}>
          {courierMarker}
        </Marker>
      ) : null}
    </MapLibreMap>
  );
}

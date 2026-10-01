import { Linking, Platform } from "react-native";
import type { Coordinates } from "./geocodeAddress";

/**
 * Abre o app de navegação nativo (Google Maps no Android; Google Maps se
 * instalado, senão Apple Maps, no iOS) já com o destino pronto pra
 * navegação turn-by-turn — este app não implementa GPS embutido.
 */
export async function openNavigation(destination: Coordinates): Promise<void> {
  const { latitude, longitude } = destination;

  if (Platform.OS === "android") {
    await Linking.openURL(`google.navigation:q=${latitude},${longitude}`);
    return;
  }

  const googleMapsUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
  const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);

  if (canOpenGoogleMaps) {
    await Linking.openURL(googleMapsUrl);
    return;
  }

  await Linking.openURL(`https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`);
}

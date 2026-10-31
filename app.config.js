/**
 * Complementa o app.json com o que não pode ser commitado:
 * - chave do Google Maps (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);
 * - google-services.json (push no Android): no EAS é uma variável de
 *   ambiente do tipo arquivo, GOOGLE_SERVICES_JSON; localmente cai no
 *   arquivo da raiz, se existir.
 */
const fs = require("fs");
const path = require("path");

module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const localGoogleServices = path.join(__dirname, "google-services.json");
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ??
    (fs.existsSync(localGoogleServices) ? "./google-services.json" : undefined);

  return {
    ...config,
    ios: {
      ...config.ios,
      config: { ...config.ios?.config, googleMapsApiKey },
    },
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
      config: { ...config.android?.config, googleMaps: { apiKey: googleMapsApiKey } },
    },
    extra: { ...config.extra, googleMapsApiKey },
  };
};

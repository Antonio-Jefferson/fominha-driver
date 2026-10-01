/**
 * Complementa o app.json injetando a chave do Google Maps a partir do
 * ambiente, pra ela nunca ser commitada.
 */
module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return {
    ...config,
    ios: {
      ...config.ios,
      config: { ...config.ios?.config, googleMapsApiKey },
    },
    android: {
      ...config.android,
      config: { ...config.android?.config, googleMaps: { apiKey: googleMapsApiKey } },
    },
    extra: { ...config.extra, googleMapsApiKey },
  };
};

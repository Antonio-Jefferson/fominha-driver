/**
 * Complementa o app.json com o que não pode ser commitado:
 * - google-services.json (push no Android): no EAS é uma variável de
 *   ambiente do tipo arquivo, GOOGLE_SERVICES_JSON; localmente cai no
 *   arquivo da raiz, se existir.
 */
const fs = require("fs");
const path = require("path");

module.exports = ({ config }) => {
  const localGoogleServices = path.join(__dirname, "google-services.json");
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ??
    (fs.existsSync(localGoogleServices) ? "./google-services.json" : undefined);

  return {
    ...config,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
  };
};

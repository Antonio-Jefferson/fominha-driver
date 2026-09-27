/**
 * Variáveis públicas do Expo. Precisam do prefixo EXPO_PUBLIC_ para
 * chegarem ao bundle.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5001/fominhadelivery/api/v1";

/** Junta base e caminho garantindo exatamente uma barra entre eles. */
export function buildApiUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

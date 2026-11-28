/**
 * Variáveis públicas do Expo. Precisam do prefixo EXPO_PUBLIC_ para
 * chegarem ao bundle.
 */
/**
 * Fallback quando a env não veio no build. Só o desenvolvimento cai no
 * localhost: um build de release sem a env aponta para a produção, nunca para
 * um servidor que não existe no aparelho do cliente (motivo de rejeição na
 * revisão da Apple, diretriz 2.1).
 */
const FALLBACK_ORIGIN = __DEV__ ? "http://localhost:5001" : "https://api.fominhadelivery.com";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `${FALLBACK_ORIGIN}/fominhadelivery/api/v1`;

/** Junta base e caminho garantindo exatamente uma barra entre eles. */
export function buildApiUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

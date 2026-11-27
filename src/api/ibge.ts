/**
 * Estados e municípios pela API pública do IBGE (sem chave). A cidade é
 * escolhida numa lista, então chega com o nome oficial ("Zé Doca"), igual ao
 * site, e casa com a cidade da loja na oferta de entrega.
 */
export const BR_STATE_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão",
  MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará",
  PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima",
  SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

/** Mesma chave do backend (city-match.ts): sem acento, caixa e pontuação. */
export function cityKey(city: string): string {
  return city
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const cache = new Map<string, string[]>();

/** Municípios da UF em ordem alfabética. Lança erro se a rede falhar. */
export async function listCities(uf: string): Promise<string[]> {
  const cached = cache.get(uf);
  if (cached) return cached;
  const res = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`
  );
  if (!res.ok) throw new Error(`IBGE ${res.status}`);
  const list = ((await res.json()) as Array<{ nome: string }>).map((m) => m.nome);
  cache.set(uf, list);
  return list;
}

/** Só para testes: limpa o cache entre casos. */
export function clearCityCache(): void {
  cache.clear();
}

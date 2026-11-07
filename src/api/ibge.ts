/**
 * Nome oficial da cidade pela API pública do IBGE (sem chave). Melhor
 * esforço: se a rede falhar ou não achar, devolve o que a pessoa digitou.
 * "ze doca" + MA vira "Zé Doca", igual ao site.
 */
function key(city: string): string {
  return city
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function officialCityName(city: string, uf: string): Promise<string> {
  const typed = city.trim();
  if (!typed || !/^[A-Z]{2}$/.test(uf)) return typed;
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
    );
    if (!res.ok) return typed;
    const list = (await res.json()) as Array<{ nome: string }>;
    return list.find((m) => key(m.nome) === key(typed))?.nome ?? typed;
  } catch {
    return typed;
  }
}

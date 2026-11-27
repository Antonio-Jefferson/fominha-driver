import { cityKey, clearCityCache, listCities } from "./ibge";

const fetchMock = jest.fn();
beforeEach(() => {
  clearCityCache();
  fetchMock.mockReset();
  (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
});

describe("ibge", () => {
  it("lista os municípios da UF e guarda em cache", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [{ nome: "Bom Jardim" }, { nome: "Zé Doca" }] });
    await expect(listCities("MA")).resolves.toEqual(["Bom Jardim", "Zé Doca"]);
    await listCities("MA");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados/MA/municipios?orderBy=nome"
    );
  });

  it("falha da API vira erro (a tela oferece tentar de novo ou digitar)", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    await expect(listCities("SP")).rejects.toThrow("IBGE 503");
  });

  it("cityKey ignora acento, caixa e pontuação", () => {
    expect(cityKey("  Zé  Doca ")).toBe("ze doca");
    expect(cityKey("Pau-d'Arco")).toBe("pau d arco");
  });
});

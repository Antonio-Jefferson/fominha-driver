import { officialCityName } from "./ibge";

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
});

describe("officialCityName", () => {
  it("troca o texto digitado pelo nome oficial do IBGE", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [{ nome: "Zé Doca" }, { nome: "Zé Doca do Norte" }] });
    await expect(officialCityName(" ze doca ", "MA")).resolves.toBe("Zé Doca");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados/MA/municipios"
    );
  });

  it("sem correspondência, mantém o que foi digitado", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [{ nome: "São Luís" }] });
    await expect(officialCityName("Cidade Nova", "MA")).resolves.toBe("Cidade Nova");
  });

  it("falha de rede não trava o cadastro", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(officialCityName("Campinas", "SP")).resolves.toBe("Campinas");
  });

  it("UF inválida nem consulta", async () => {
    await expect(officialCityName("Campinas", "")).resolves.toBe("Campinas");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

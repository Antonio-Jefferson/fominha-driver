import { decodePolyline } from "./decodePolyline";

describe("decodePolyline", () => {
  it("decodifica o exemplo oficial da documentação do Google", () => {
    const result = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");

    expect(result).toEqual([
      { latitude: 38.5, longitude: -120.2 },
      { latitude: 40.7, longitude: -120.95 },
      { latitude: 43.252, longitude: -126.453 },
    ]);
  });

  it("devolve array vazio para string vazia", () => {
    expect(decodePolyline("")).toEqual([]);
  });
});

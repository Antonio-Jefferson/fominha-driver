import { geocodeAddress } from "./geocodeAddress";

const originalFetch = global.fetch;

describe("geocodeAddress", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("devolve lat/lng quando a Geocoding API encontra o endereço", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        status: "OK",
        results: [{ geometry: { location: { lat: -3.7, lng: -45.3 } } }],
      }),
    }) as never;

    const result = await geocodeAddress(
      { street: "Rua A", number: "10", district: "Centro", city: "Santa Inês", state: "MA" },
      "fake-key"
    );

    expect(result).toEqual({ latitude: -3.7, longitude: -45.3 });
  });

  it("devolve null quando a Geocoding API não encontra nada", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ status: "ZERO_RESULTS", results: [] }),
    }) as never;

    const result = await geocodeAddress(
      { street: null, number: null, district: null, city: null, state: null },
      "fake-key"
    );

    expect(result).toBeNull();
  });

  it("devolve null quando a chamada falha, sem lançar", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down")) as never;

    const result = await geocodeAddress(
      { street: "Rua A", number: "10", district: null, city: "Santa Inês", state: "MA" },
      "fake-key"
    );

    expect(result).toBeNull();
  });
});

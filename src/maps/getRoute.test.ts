import { getRoute } from "./getRoute";

const originalFetch = global.fetch;

describe("getRoute", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("devolve pontos, distância e duração quando a Directions API acha uma rota", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        status: "OK",
        routes: [
          {
            overview_polyline: { points: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" },
            legs: [{ distance: { text: "12 km" }, duration: { text: "18 min" } }],
          },
        ],
      }),
    }) as never;

    const result = await getRoute(
      { latitude: -3.7, longitude: -45.3 },
      { latitude: -3.71, longitude: -45.31 },
      "fake-key"
    );

    expect(result).toEqual({
      points: [
        { latitude: 38.5, longitude: -120.2 },
        { latitude: 40.7, longitude: -120.95 },
        { latitude: 43.252, longitude: -126.453 },
      ],
      distanceText: "12 km",
      durationText: "18 min",
    });
  });

  it("devolve null quando não há rota", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ status: "ZERO_RESULTS", routes: [] }),
    }) as never;

    const result = await getRoute(
      { latitude: -3.7, longitude: -45.3 },
      { latitude: -3.71, longitude: -45.31 },
      "fake-key"
    );

    expect(result).toBeNull();
  });
});

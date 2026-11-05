import { routeSummary } from "./routeSummary";

describe("routeSummary", () => {
  it("formata em km com vírgula", () => {
    expect(routeSummary({ distance_meters: 2302, duration_seconds: 219 })).toBe("4 min · 2,3 km");
  });

  it("na chegada troca os números por uma palavra", () => {
    expect(routeSummary({ distance_meters: 10, duration_seconds: 3 })).toBe("Chegando");
  });

  it("usa metros na reta final e nunca mostra 0 min", () => {
    expect(routeSummary({ distance_meters: 84, duration_seconds: 12 })).toBe("1 min · 80 m");
  });
});

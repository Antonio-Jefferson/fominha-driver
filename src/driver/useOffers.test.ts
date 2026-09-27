import { secondsUntil } from "./useOffers";

describe("secondsUntil", () => {
  it("calcula os segundos restantes até uma data futura", () => {
    const now = new Date("2026-01-01T10:00:00.000Z");
    const expiresAt = "2026-01-01T10:01:30.000Z";

    expect(secondsUntil(expiresAt, now)).toBe(90);
  });

  it("nunca devolve negativo — oferta já expirada vira 0", () => {
    const now = new Date("2026-01-01T10:02:00.000Z");
    const expiresAt = "2026-01-01T10:01:30.000Z";

    expect(secondsUntil(expiresAt, now)).toBe(0);
  });
});

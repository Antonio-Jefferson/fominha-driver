import { shouldTrack } from "./useLocationTracking";

describe("shouldTrack", () => {
  it("rastreia quando o entregador está online", () => {
    expect(shouldTrack({ online: true, hasActiveDelivery: false })).toBe(true);
  });

  it("rastreia quando há uma entrega ativa, mesmo offline", () => {
    expect(shouldTrack({ online: false, hasActiveDelivery: true })).toBe(true);
  });

  it("não rastreia quando offline e sem entrega ativa", () => {
    expect(shouldTrack({ online: false, hasActiveDelivery: false })).toBe(false);
  });
});

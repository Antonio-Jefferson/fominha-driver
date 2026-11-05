import { shouldTrack } from "./useLocationTracking";

describe("shouldTrack", () => {
  it("rastreia quando o entregador está online", () => {
    expect(shouldTrack({ online: true, hasActiveDelivery: false })).toBe(true);
  });

  it("com entrega ativa deixa o GPS para o rastreio da entrega", () => {
    expect(shouldTrack({ online: true, hasActiveDelivery: true })).toBe(false);
    expect(shouldTrack({ online: false, hasActiveDelivery: true })).toBe(false);
  });

  it("não rastreia quando offline e sem entrega ativa", () => {
    expect(shouldTrack({ online: false, hasActiveDelivery: false })).toBe(false);
  });
});

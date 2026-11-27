import { api } from "./client";
import { getActiveDelivery, getActiveDeliveryMap } from "./deliveries";

jest.mock("./client", () => ({ api: { get: jest.fn() } }));

const get = api.get as jest.Mock;

describe("sem entrega ativa", () => {
  // O corpo vazio do back chega como undefined, e o React Query recusa undefined.
  it("getActiveDelivery devolve null, nunca undefined", async () => {
    get.mockResolvedValue(undefined);
    await expect(getActiveDelivery()).resolves.toBeNull();
  });

  it("getActiveDeliveryMap devolve null, nunca undefined", async () => {
    get.mockResolvedValue(undefined);
    await expect(getActiveDeliveryMap()).resolves.toBeNull();
  });

  it("com entrega ativa devolve o que veio", async () => {
    get.mockResolvedValue({ id_order: "o1" });
    await expect(getActiveDelivery()).resolves.toEqual({ id_order: "o1" });
  });
});

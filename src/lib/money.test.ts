import { brl } from "./money";

describe("brl", () => {
  it("formata centavos em reais", () => {
    expect(brl(850).replace(/ /g, " ")).toBe("R$ 8,50");
    expect(brl(0).replace(/ /g, " ")).toBe("R$ 0,00");
    expect(brl(18640).replace(/ /g, " ")).toBe("R$ 186,40");
  });
});

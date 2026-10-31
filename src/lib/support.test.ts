import { supportWhatsAppUrl } from "./support";

describe("supportWhatsAppUrl", () => {
  it("aponta para o número do suporte com a mensagem codificada", () => {
    expect(supportWhatsAppUrl("Oi, tudo bem?")).toBe(
      "https://wa.me/5598985856218?text=Oi%2C%20tudo%20bem%3F"
    );
  });
});

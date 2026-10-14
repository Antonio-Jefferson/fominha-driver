import { isCodeAlreadyUsedError } from "./errors";

describe("isCodeAlreadyUsedError", () => {
  it("reconhece a mensagem de código já utilizado, com capitalização exata", () => {
    expect(isCodeAlreadyUsedError("Este código já foi utilizado")).toBe(true);
  });

  it("é case-insensitive", () => {
    expect(isCodeAlreadyUsedError("ESTE CÓDIGO JÁ FOI UTILIZADO")).toBe(true);
    expect(isCodeAlreadyUsedError("este código já foi utilizado.")).toBe(true);
  });

  it("reconhece a mensagem mesmo com texto adicional em volta", () => {
    expect(
      isCodeAlreadyUsedError("Erro: este código já foi utilizado por outra tentativa.")
    ).toBe(true);
  });

  it("não reconhece outras mensagens de erro, como código incorreto", () => {
    expect(isCodeAlreadyUsedError("Código incorreto.")).toBe(false);
  });

  it("não reconhece mensagens genéricas de erro", () => {
    expect(isCodeAlreadyUsedError("Erro inesperado.")).toBe(false);
    expect(isCodeAlreadyUsedError("")).toBe(false);
  });
});

import { formatCpf, formatPhone, isValidCpf } from "./masks";

describe("masks", () => {
  it("formata CPF progressivamente", () => {
    expect(formatCpf("123")).toBe("123");
    expect(formatCpf("1234")).toBe("123.4");
    expect(formatCpf("12345678901")).toBe("123.456.789-01");
    expect(formatCpf("123.456.789-0199")).toBe("123.456.789-01");
  });

  it("formata telefone com 10 e 11 dígitos", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone("98")).toBe("(98");
    expect(formatPhone("9899")).toBe("(98) 99");
    expect(formatPhone("9833334444")).toBe("(98) 3333-4444");
    expect(formatPhone("98999998888")).toBe("(98) 99999-8888");
  });

  it("valida dígitos verificadores do CPF", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224726")).toBe(false);
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
});

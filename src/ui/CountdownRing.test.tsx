import { render, screen } from "@testing-library/react-native";
import { CountdownRing, ringOffset } from "./CountdownRing";

describe("ringOffset", () => {
  it("é 0 com o tempo cheio e a circunferência com o tempo zerado", () => {
    expect(ringOffset(30, 30, 100)).toBe(0);
    expect(ringOffset(0, 30, 100)).toBe(100);
  });
  it("é proporcional no meio e não passa dos limites", () => {
    expect(ringOffset(15, 30, 100)).toBe(50);
    expect(ringOffset(99, 30, 100)).toBe(0);
    expect(ringOffset(-5, 30, 100)).toBe(100);
  });
  it("trata total inválido como anel vazio", () => {
    expect(ringOffset(10, 0, 100)).toBe(100);
  });
});

describe("CountdownRing", () => {
  it("anuncia os segundos restantes", () => {
    render(<CountdownRing remaining={18} total={30} />);
    expect(screen.getByLabelText("18 segundos para aceitar")).toBeTruthy();
  });
});

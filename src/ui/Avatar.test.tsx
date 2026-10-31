import { render, screen } from "@testing-library/react-native";
import { Avatar, initialsOf } from "./Avatar";

describe("initialsOf", () => {
  it("usa primeira e última palavra", () => {
    expect(initialsOf("Marcos Vinícius Sousa")).toBe("MS");
  });
  it("usa uma letra quando há uma palavra só", () => {
    expect(initialsOf("marcos")).toBe("M");
  });
  it("ignora espaços sobrando e devolve ? sem nome", () => {
    expect(initialsOf("  ana   paula ")).toBe("AP");
    expect(initialsOf("   ")).toBe("?");
  });
});

describe("Avatar", () => {
  it("mostra as iniciais", () => {
    render(<Avatar name="Marcos Sousa" />);
    expect(screen.getByText("MS", { includeHiddenElements: true })).toBeTruthy();
  });
});

import { fireEvent, render, screen } from "@testing-library/react-native";
import { StateCard } from "./StateCard";

describe("StateCard", () => {
  it("offline: oferece ficar online", () => {
    const onToggle = jest.fn();
    render(<StateCard online={false} busy={false} onToggle={onToggle} />);
    expect(screen.getByText("Você está offline")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Ficar online" }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("online: mostra a busca e oferece ficar offline", () => {
    const onToggle = jest.fn();
    render(<StateCard online busy={false} onToggle={onToggle} />);
    expect(screen.getByText("Procurando corridas perto de você")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Ficar offline" }));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("não dispara enquanto troca de estado", () => {
    const onToggle = jest.fn();
    render(<StateCard online busy onToggle={onToggle} />);
    fireEvent.press(screen.getByRole("button", { name: "Ficar offline" }));
    expect(onToggle).not.toHaveBeenCalled();
  });
});

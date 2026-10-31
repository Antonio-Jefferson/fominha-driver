import { fireEvent, render, screen } from "@testing-library/react-native";
import { BalanceCard } from "./BalanceCard";

const base = {
  availableCents: 18640,
  pendingCents: 2400,
  inReviewCents: 0,
  amount: "",
  onAmountChange: jest.fn(),
  onSubmit: jest.fn(),
  submitting: false,
  error: null,
};

describe("BalanceCard", () => {
  it("mostra saldo e pendente", () => {
    render(<BalanceCard {...base} />);
    expect(screen.getByText(/R\$\s186,40/)).toBeTruthy();
    expect(screen.getByText(/R\$\s24,00/)).toBeTruthy();
  });

  it("repassa o valor digitado e o toque em Sacar", () => {
    const onAmountChange = jest.fn();
    const onSubmit = jest.fn();
    render(<BalanceCard {...base} onAmountChange={onAmountChange} onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByLabelText("Valor do saque"), "50");
    expect(onAmountChange).toHaveBeenCalledWith("50");
    fireEvent.press(screen.getByRole("button", { name: "Sacar" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("mostra o erro", () => {
    render(<BalanceCard {...base} error="Informe um valor válido." />);
    expect(screen.getByText("Informe um valor válido.")).toBeTruthy();
  });
});

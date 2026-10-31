import { render, screen } from "@testing-library/react-native";
import { LedgerRow, formatSigned } from "./LedgerRow";

describe("formatSigned", () => {
  it("usa + para entrada e − para saída", () => {
    expect(formatSigned(850).replace(/ /g, " ")).toBe("+ R$ 8,50");
    expect(formatSigned(-12000).replace(/ /g, " ")).toBe("− R$ 120,00");
  });
});

describe("LedgerRow", () => {
  it("traduz o tipo do lançamento", () => {
    render(
      <LedgerRow
        entry={{
          id: "1",
          type: "DRIVER_EARNING",
          amount_cents: 850,
          status: "AVAILABLE",
          order_id: null,
          occurred_at: "2026-10-28T12:00:00.000Z",
        }}
      />
    );
    expect(screen.getByText("Ganho de entrega")).toBeTruthy();
  });
});

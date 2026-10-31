import { render, screen } from "@testing-library/react-native";
import { StepTracker, currentStep } from "./StepTracker";

describe("currentStep", () => {
  it("mapeia o status do pedido para o passo", () => {
    expect(currentStep("READY_FOR_PICKUP")).toBe(1);
    expect(currentStep("PICKED_UP")).toBe(2);
    expect(currentStep("DELIVERY")).toBe(3);
  });
});

describe("StepTracker", () => {
  it("anuncia o passo atual", () => {
    render(<StepTracker status="PICKED_UP" />);
    expect(screen.getByLabelText("Passo 2 de 3: Levar")).toBeTruthy();
  });
});

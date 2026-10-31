import { render, screen } from "@testing-library/react-native";
import { RouteLegs } from "./RouteLegs";

describe("RouteLegs", () => {
  it("não renderiza nada sem dados", () => {
    const { toJSON } = render(<RouteLegs />);
    expect(toJSON()).toBeNull();
  });

  it("mostra restaurante e bairros", () => {
    render(
      <RouteLegs
        pickupName="Cantinho da Dona Rosa"
        pickupDistrict="Centro"
        dropoffDistrict="Vila Nova"
      />
    );
    expect(screen.getByText("Cantinho da Dona Rosa")).toBeTruthy();
    expect(screen.getByText("Retirada · Centro")).toBeTruthy();
    expect(screen.getByText("Vila Nova")).toBeTruthy();
    expect(screen.getByText("Entrega")).toBeTruthy();
  });

  it("mostra só a retirada quando falta o bairro de entrega", () => {
    render(<RouteLegs pickupName="Brasa Burguer" />);
    expect(screen.getByText("Brasa Burguer")).toBeTruthy();
    expect(screen.getByText("Retirada")).toBeTruthy();
    expect(screen.queryByText("Entrega")).toBeNull();
  });
});

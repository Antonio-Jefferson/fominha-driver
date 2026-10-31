import { fireEvent, render, screen } from "@testing-library/react-native";
import { OfferSheet, offerLifetimeSeconds } from "./OfferSheet";
import type { DeliveryOffer } from "../@types/driver";

const NOW = Date.now();
const offer: DeliveryOffer = {
  id_delivery_offer: "o1",
  id_order: "p1",
  id_establishment: "e1",
  id_driver: "d1",
  enum_status: "OFFERED",
  int_payout_cents: 850,
  dt_offered_at: new Date(NOW - 12_000).toISOString(),
  dt_expires_at: new Date(NOW + 18_000).toISOString(),
  pickup_name: "Cantinho da Dona Rosa",
  pickup_district: "Centro",
  dropoff_district: "Vila Nova",
};

describe("offerLifetimeSeconds", () => {
  it("é a diferença entre oferta e expiração, com mínimo de 1", () => {
    expect(offerLifetimeSeconds(offer)).toBe(30);
    expect(
      offerLifetimeSeconds({ dt_offered_at: offer.dt_expires_at, dt_expires_at: offer.dt_expires_at })
    ).toBe(1);
  });
});

describe("OfferSheet", () => {
  it("mostra valor, restaurante e a fila", () => {
    render(<OfferSheet offer={offer} queued={2} onAccept={jest.fn()} onDecline={jest.fn()} />);
    expect(screen.getByText(/R\$\s8,50/)).toBeTruthy();
    expect(screen.getByText("Cantinho da Dona Rosa")).toBeTruthy();
    expect(screen.getByText(/mais 2 na fila/)).toBeTruthy();
  });

  it("chama aceitar e recusar", () => {
    const onAccept = jest.fn();
    const onDecline = jest.fn();
    render(<OfferSheet offer={offer} queued={0} onAccept={onAccept} onDecline={onDecline} />);
    fireEvent.press(screen.getByRole("button", { name: "Aceitar corrida" }));
    fireEvent.press(screen.getByRole("button", { name: "Recusar" }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it("funciona sem os campos novos do back", () => {
    const { pickup_name, pickup_district, dropoff_district, ...legacy } = offer;
    render(<OfferSheet offer={legacy} queued={0} onAccept={jest.fn()} onDecline={jest.fn()} />);
    expect(screen.getByText(/R\$\s8,50/)).toBeTruthy();
    expect(screen.queryByText("Cantinho da Dona Rosa")).toBeNull();
  });
});

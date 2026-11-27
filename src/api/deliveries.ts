import { api } from "./client";
import type { ActiveDelivery, ActiveDeliveryMap, DeliveryOffer } from "../@types/driver";

export function listOffers(): Promise<DeliveryOffer[]> {
  return api.get<DeliveryOffer[]>("deliveries/offers");
}

export function acceptOffer(offerId: string): Promise<{ status: string }> {
  return api.post(`deliveries/offers/${offerId}/accept`);
}

export function declineOffer(offerId: string): Promise<{ status: string }> {
  return api.post(`deliveries/offers/${offerId}/decline`);
}

// Sem entrega ativa o back responde com corpo vazio, que chega aqui como
// `undefined`. O React Query recusa esse valor e mantém o dado anterior: o
// entregador ficaria preso na tela da corrida já concluída.
export async function getActiveDelivery(): Promise<ActiveDelivery | null> {
  return (await api.get<ActiveDelivery | null>("deliveries/active")) ?? null;
}

export async function getActiveDeliveryMap(): Promise<ActiveDeliveryMap | null> {
  return (await api.get<ActiveDeliveryMap | null>("deliveries/active/map")) ?? null;
}

export function pickupOrder(orderId: string): Promise<{ status: string }> {
  return api.post(`deliveries/${orderId}/pickup`);
}

export function startDelivery(orderId: string): Promise<{ status: string }> {
  return api.post(`deliveries/${orderId}/start`);
}

export function confirmDeliveryCode(
  orderId: string,
  code: string
): Promise<{ status: string }> {
  return api.post(`deliveries/${orderId}/confirm-code`, { code });
}

/** Entrega de motoboy da loja: esse modelo não tem código de confirmação. */
export function completeDelivery(orderId: string): Promise<{ status: string }> {
  return api.post(`deliveries/${orderId}/complete`);
}

export function updateLocation(
  latitude: number,
  longitude: number
): Promise<{ status: string }> {
  return api.post("deliveries/location", { latitude, longitude });
}

export function setOnline(online: boolean): Promise<{ online: boolean }> {
  return api.post("deliveries/online", { online });
}

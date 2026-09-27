import { api } from "./client";
import type { ActiveDelivery, DeliveryOffer } from "../@types/driver";

export function listOffers(): Promise<DeliveryOffer[]> {
  return api.get<DeliveryOffer[]>("deliveries/offers");
}

export function acceptOffer(offerId: string): Promise<{ status: string }> {
  return api.post(`deliveries/offers/${offerId}/accept`);
}

export function declineOffer(offerId: string): Promise<{ status: string }> {
  return api.post(`deliveries/offers/${offerId}/decline`);
}

export function getActiveDelivery(): Promise<ActiveDelivery | null> {
  return api.get<ActiveDelivery | null>("deliveries/active");
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

export function updateLocation(
  latitude: number,
  longitude: number
): Promise<{ status: string }> {
  return api.post("deliveries/location", { latitude, longitude });
}

export function setOnline(online: boolean): Promise<{ online: boolean }> {
  return api.post("deliveries/online", { online });
}

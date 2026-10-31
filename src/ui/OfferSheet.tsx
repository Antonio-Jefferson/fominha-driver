import { Text, View } from "react-native";
import { Button } from "./Button";
import { CountdownRing } from "./CountdownRing";
import { RouteLegs } from "./RouteLegs";
import { brl } from "../lib/money";
import { secondsUntil } from "../driver/useOffers";
import type { DeliveryOffer } from "../@types/driver";

/** Tempo total que a oferta ficou aberta, em segundos (mínimo 1). */
export function offerLifetimeSeconds(
  offer: Pick<DeliveryOffer, "dt_offered_at" | "dt_expires_at">
): number {
  const ms = new Date(offer.dt_expires_at).getTime() - new Date(offer.dt_offered_at).getTime();
  return Math.max(1, Math.round(ms / 1000));
}

export function OfferSheet({
  offer,
  queued,
  onAccept,
  onDecline,
}: {
  offer: DeliveryOffer;
  /** Quantas outras ofertas esperam depois desta. */
  queued: number;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const remaining = secondsUntil(offer.dt_expires_at);

  return (
    <View className="absolute inset-0 justify-end">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="absolute inset-0 bg-black/55"
      />
      <View accessibilityViewIsModal className="gap-5 rounded-t-[30px] bg-card px-5 pb-8 pt-3">
        <View className="h-1.5 w-10 self-center rounded-full bg-border" />
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-muted-foreground">
              {queued > 0 ? `Nova corrida · mais ${queued} na fila` : "Nova corrida"}
            </Text>
            <Text className="font-poppins-extrabold text-[44px] leading-[52px] text-foreground">
              {brl(offer.int_payout_cents)}
            </Text>
            <Text className="text-sm text-muted-foreground">você recebe nesta entrega</Text>
          </View>
          <CountdownRing remaining={remaining} total={offerLifetimeSeconds(offer)} />
        </View>
        <RouteLegs
          pickupName={offer.pickup_name}
          pickupDistrict={offer.pickup_district}
          dropoffDistrict={offer.dropoff_district}
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button label="Recusar" variant="outline" height="h-16" onPress={onDecline} />
          </View>
          <View className="flex-[2]">
            <Button label="Aceitar corrida" height="h-16" onPress={onAccept} />
          </View>
        </View>
      </View>
    </View>
  );
}

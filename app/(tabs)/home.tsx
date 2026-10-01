import { useEffect, useRef, useState } from "react";
import { FlatList, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";
import { Screen } from "../../src/ui/Screen";
import { Button } from "../../src/ui/Button";
import { EmptyState } from "../../src/ui/EmptyState";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";
import { getActiveDelivery, setOnline } from "../../src/api/deliveries";
import { useOffers, secondsUntil } from "../../src/driver/useOffers";
import { useDriver } from "../../src/driver/DriverContext";
import { useLocationTracking } from "../../src/maps/useLocationTracking";
import type { DeliveryOffer } from "../../src/@types/driver";

function showError(err: unknown, fallback: string) {
  Toast.show({ type: "error", text1: err instanceof Error ? err.message : fallback });
}

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function OfferCard({
  offer,
  onAccept,
  onDecline,
}: {
  offer: DeliveryOffer;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const seconds = secondsUntil(offer.dt_expires_at);

  return (
    <View className="mb-3 gap-3 rounded border border-border bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-foreground">
          {brl(offer.int_payout_cents)}
        </Text>
        <Text className="text-sm text-muted-foreground">Expira em {seconds}s</Text>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button label="Recusar" variant="outline" onPress={onDecline} />
        </View>
        <View className="flex-1">
          <Button label="Aceitar" onPress={onAccept} />
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [online, setOnlineState] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  const { driver } = useDriver();

  // A Task 17 (Perfil) confirmou que esta corrida deixou de ser teórica:
  // Profile chama refreshDriver() depois de salvar, e abas do bottom-tab
  // navigator ficam montadas em segundo plano por padrão — então, sem essa
  // guarda, um refreshDriver() disparado por outra aba enquanto um toggle
  // está em voo podia reverter o switch pro valor antigo de bool_online sem
  // avisar o usuário. Corrigido sincronizando só uma vez, no carregamento
  // inicial do perfil — depois disso, toggleOnline (via setOnlineState) já
  // é a única fonte de verdade local, e refreshDriver() de outras telas não
  // pisa mais nela.
  const onlineInitializedRef = useRef(false);
  useEffect(() => {
    if (driver && !onlineInitializedRef.current) {
      setOnlineState(driver.bool_online);
      onlineInitializedRef.current = true;
    }
  }, [driver]);

  const activeQuery = useQuery({
    queryKey: ["active-delivery"],
    queryFn: getActiveDelivery,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (activeQuery.data) {
      router.replace("/delivery/active");
    }
  }, [activeQuery.data, router]);

  const { offers, isLoading, accept, decline } = useOffers(online && !activeQuery.data);

  useLocationTracking({ online, hasActiveDelivery: Boolean(activeQuery.data) });

  async function toggleOnline(value: boolean) {
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showError(
          null,
          "Precisamos da sua localização para te conectar a entregas. Ative a permissão de localização nas configurações do app."
        );
        return;
      }
    }

    setTogglingOnline(true);
    try {
      const result = await setOnline(value);
      setOnlineState(result.online);
    } catch (err) {
      showError(err, "Não foi possível atualizar seu status.");
    } finally {
      setTogglingOnline(false);
    }
  }

  if (activeQuery.isLoading) return <LoadingSpinner />;

  return (
    <Screen>
      <View className="flex-1">
        <View className="mt-4 flex-row items-center justify-between rounded border border-border bg-card p-4">
          <View>
            <Text className="text-base font-bold text-foreground">
              {online ? "Você está online" : "Você está offline"}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {online ? "Recebendo ofertas de entrega" : "Fique online para receber ofertas"}
            </Text>
          </View>
          <Switch
            value={online}
            onValueChange={(value) => void toggleOnline(value)}
            disabled={togglingOnline}
          />
        </View>

        <View className="mt-4 flex-1">
          {!online ? (
            <EmptyState
              title="Você está offline"
              description="Ative o toggle acima para começar a receber ofertas de entrega."
            />
          ) : isLoading ? (
            <LoadingSpinner />
          ) : offers.length === 0 ? (
            <EmptyState
              title="Nenhuma oferta no momento"
              description="Assim que houver uma entrega perto de você, ela aparece aqui."
            />
          ) : (
            <FlatList
              data={offers}
              keyExtractor={(item) => item.id_delivery_offer}
              renderItem={({ item }) => (
                <OfferCard
                  offer={item}
                  onAccept={() =>
                    void accept(item.id_delivery_offer).catch((err) =>
                      showError(err, "Essa oferta não está mais disponível.")
                    )
                  }
                  onDecline={() =>
                    void decline(item.id_delivery_offer).catch((err) =>
                      showError(err, "Não foi possível recusar a oferta.")
                    )
                  }
                />
              )}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

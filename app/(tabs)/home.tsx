import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";
import { Screen } from "../../src/ui/Screen";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";
import { StateCard } from "../../src/ui/StateCard";
import { OfferSheet } from "../../src/ui/OfferSheet";
import { Avatar } from "../../src/ui/Avatar";
import { usePalette } from "../../src/ui/theme";
import { brl } from "../../src/lib/money";
import { getActiveDelivery, setOnline } from "../../src/api/deliveries";
import { getBalance } from "../../src/api/wallet";
import { useOffers } from "../../src/driver/useOffers";
import { useDriver } from "../../src/driver/DriverContext";
import { useLocationTracking } from "../../src/maps/useLocationTracking";

function showError(err: unknown, fallback: string) {
  Toast.show({ type: "error", text1: err instanceof Error ? err.message : fallback });
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

  const p = usePalette();
  const { data: balance } = useQuery({ queryKey: ["driver-balance"], queryFn: getBalance });

  if (activeQuery.isLoading) return <LoadingSpinner />;

  const [firstOffer, ...queuedOffers] = offers;
  const firstName = driver?.tx_full_name.split(" ")[0] ?? "";

  return (
    <View className="flex-1">
      <Screen>
        <View className="mt-4 flex-1 gap-4">
          <View className="flex-row items-center gap-3">
            <Avatar name={driver?.tx_full_name ?? ""} />
            <View className="flex-1">
              <Text className="font-poppins-bold text-xl text-foreground">Olá, {firstName}</Text>
              <Text className="text-sm text-muted-foreground">
                {driver?.tx_city}
                {driver?.tx_vehicle_type ? ` · ${driver.tx_vehicle_type}` : ""}
              </Text>
            </View>
          </View>

          {driver?.id_establishment ? (
            // Motoboy da loja não pega corrida da plataforma nem precisa ficar
            // online: a entrega abre sozinha quando a loja escolhe ele.
            <View className="gap-1 rounded-3xl bg-deck p-5">
              <Text className="font-poppins-bold text-xl text-deck-foreground">
                Entregas da sua loja
              </Text>
              <Text className="text-sm text-deck-foreground">
                Quando a loja escolher você, a entrega abre aqui com o endereço e a rota.
              </Text>
            </View>
          ) : (
            <StateCard
              online={online}
              busy={togglingOnline}
              onToggle={(value) => void toggleOnline(value)}
            />
          )}

          {online && isLoading ? <LoadingSpinner /> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir carteira"
            onPress={() => router.push("/wallet")}
            className="flex-row items-center justify-between rounded-3xl border border-border bg-card py-4 pl-5 pr-4 active:opacity-70"
          >
            <View>
              <Text className="text-sm font-semibold text-muted-foreground">Disponível para saque</Text>
              <Text className="font-poppins-bold text-2xl text-foreground">
                {balance ? brl(balance.available_cents) : "—"}
              </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
              <ChevronRight size={22} color={p.foreground} />
            </View>
          </Pressable>
        </View>
      </Screen>

      {online && firstOffer ? (
        <OfferSheet
          offer={firstOffer}
          queued={queuedOffers.length}
          onAccept={() =>
            void accept(firstOffer.id_delivery_offer).catch((err) =>
              showError(err, "Essa oferta não está mais disponível.")
            )
          }
          onDecline={() =>
            void decline(firstOffer.id_delivery_offer).catch((err) =>
              showError(err, "Não foi possível recusar a oferta.")
            )
          }
        />
      ) : null}
    </View>
  );
}

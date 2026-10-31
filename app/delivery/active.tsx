import { useEffect, useState } from "react";
import Constants from "expo-constants";
import * as Location from "expo-location";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { geocodeAddress, type Coordinates } from "../../src/maps/geocodeAddress";
import { getRoute, type Route } from "../../src/maps/getRoute";
import { openNavigation } from "../../src/maps/openNavigation";
import { Modal, Pressable, Text, View } from "react-native";
import { Navigation } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "../../src/ui/Screen";
import { Input } from "../../src/ui/Input";
import { Button } from "../../src/ui/Button";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";
import {
  confirmDeliveryCode,
  getActiveDelivery,
  pickupOrder,
  startDelivery,
} from "../../src/api/deliveries";
import { isCodeAlreadyUsedError } from "../../src/api/errors";
import { KeyboardAwareScroll } from "../../src/ui/KeyboardAwareScroll";
import { StepTracker } from "../../src/ui/StepTracker";
import { ThemeRoot } from "../../src/ui/ThemeRoot";
import { usePalette } from "../../src/ui/theme";
import { brl } from "../../src/lib/money";

function formatAddress(address: {
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  complement?: string | null;
}): string {
  const parts = [
    [address.street, address.number].filter(Boolean).join(", "),
    address.complement,
    address.district,
    [address.city, address.state].filter(Boolean).join(" - "),
  ].filter(Boolean);
  return parts.join(" • ") || "Endereço não informado";
}

export default function ActiveDeliveryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const p = usePalette();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [code, setCode] = useState("");
  // Hooks (e o derivado `geocodableDestination`) precisam ficar antes de
  // qualquer return condicional — Rules of Hooks. O JSX que realmente usa
  // esses dados só aparece bem mais abaixo, depois do guard de loading.
  const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(null);
  const [driverCoords, setDriverCoords] = useState<Coordinates | null>(null);

  const { data: delivery, isLoading } = useQuery({
    queryKey: ["active-delivery"],
    queryFn: getActiveDelivery,
    refetchInterval: 10_000,
  });

  const geocodableDestination = delivery
    ? delivery.enum_status === "READY_FOR_PICKUP"
      ? delivery.pickup
      : delivery.dropoff
    : null;
  const googleMapsApiKey = Constants.expoConfig?.extra?.googleMapsApiKey as string | undefined;

  // Cancela resultado de geocoding fora de ordem: se o destino mudar de
  // novo antes da resposta anterior chegar, essa resposta antiga não pode
  // sobrescrever o resultado do destino atual. Mesmo padrão do efeito de
  // posição do entregador logo abaixo. `setDestinationCoords(null)` no
  // início evita mostrar o pin do destino anterior como se já fosse o
  // atual enquanto o novo geocoding ainda está em voo.
  useEffect(() => {
    let cancelled = false;
    setDestinationCoords(null);

    if (!geocodableDestination) return;

    void geocodeAddress(geocodableDestination, googleMapsApiKey ?? "").then((coords) => {
      if (!cancelled) setDestinationCoords(coords);
    });

    return () => {
      cancelled = true;
    };
  }, [geocodableDestination, googleMapsApiKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadDriverPosition() {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;
      const position = await Location.getCurrentPositionAsync({});
      if (!cancelled) {
        setDriverCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }
    }

    void loadDriverPosition();
    return () => {
      cancelled = true;
    };
  }, []);

  const [route, setRoute] = useState<Route | null>(null);

  // Mesma proteção de corrida do efeito de geocoding acima: se o destino
  // mudar de novo antes da resposta da Directions API chegar, essa resposta
  // antiga não pode sobrescrever a rota do destino atual.
  useEffect(() => {
    let cancelled = false;
    setRoute(null);

    if (!driverCoords || !destinationCoords || !googleMapsApiKey) return;

    void getRoute(driverCoords, destinationCoords, googleMapsApiKey).then((result) => {
      if (!cancelled) setRoute(result);
    });

    return () => {
      cancelled = true;
    };
  }, [driverCoords, destinationCoords, googleMapsApiKey]);

  if (isLoading || !delivery) return <LoadingSpinner />;

  const activeDelivery = delivery;

  async function refreshAfterAction() {
    await queryClient.invalidateQueries({ queryKey: ["active-delivery"] });
  }

  async function handlePickup() {
    setError(null);
    setBusy(true);
    try {
      await pickupOrder(activeDelivery.id_order);
      await refreshAfterAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível confirmar a retirada.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    setError(null);
    setBusy(true);
    try {
      await startDelivery(activeDelivery.id_order);
      await refreshAfterAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar a entrega.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmCode() {
    setError(null);
    setBusy(true);
    try {
      await confirmDeliveryCode(activeDelivery.id_order, code);
      setCodeModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["active-delivery"] });
      router.replace("/(tabs)/home");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Código incorreto.";

      // Esse erro específico só acontece depois que o código já foi
      // consumido — sinal de que a entrega já foi confirmada antes (ex: a
      // 1ª tentativa teve sucesso no banco, mas a resposta falhou em chegar
      // ao app). Em vez de travar o entregador numa tela sem saída,
      // tratamos isso como recuperação de sucesso.
      if (isCodeAlreadyUsedError(message)) {
        setCodeModalOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["active-delivery"] });
        router.replace("/(tabs)/home");
        return;
      }

      setError(message);
    } finally {
      setBusy(false);
    }
  }

  const destination =
    activeDelivery.enum_status === "READY_FOR_PICKUP" ? activeDelivery.pickup : activeDelivery.dropoff;
  const destinationLabel =
    activeDelivery.enum_status === "READY_FOR_PICKUP" ? "Retirar em" : "Entregar em";

  const recipient = "name" in destination ? destination.name : activeDelivery.tx_customer_name;
  const status = activeDelivery.enum_status;

  return (
    <Screen>
      <KeyboardAwareScroll
        keyboardShouldPersistTaps="handled"
        className="flex-1"
        contentContainerClassName="gap-4 pb-6 pt-2"
      >
        {destinationCoords ? (
          <View className="h-72 overflow-hidden rounded-3xl">
            <MapView
              key={`${destinationCoords.latitude},${destinationCoords.longitude}`}
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: destinationCoords.latitude,
                longitude: destinationCoords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              {route ? (
                <Polyline coordinates={route.points} strokeColor={p.primary} strokeWidth={5} />
              ) : null}
              <Marker coordinate={destinationCoords} title={destinationLabel} pinColor={p.primary} />
              {driverCoords ? (
                <Marker coordinate={driverCoords} title="Você" pinColor={p.foreground} />
              ) : null}
            </MapView>
            {route ? (
              <View className="absolute bottom-3 left-3 h-10 flex-row items-center rounded-full bg-card px-3.5">
                <Text className="text-sm text-foreground">
                  <Text className="font-bold">{route.durationText}</Text> · {route.distanceText}
                </Text>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Navegar"
              onPress={() =>
                void openNavigation(destinationCoords).catch(() =>
                  setError("Não foi possível abrir o app de navegação.")
                )
              }
              className="absolute bottom-3 right-3 h-12 flex-row items-center gap-2 rounded-full bg-deck px-4 active:opacity-80"
            >
              <Navigation size={18} color={p.primary} />
              <Text className="text-[15px] font-semibold text-deck-foreground">Navegar</Text>
            </Pressable>
          </View>
        ) : null}

        <StepTracker status={status} />

        <View className="gap-1">
          <Text className="text-sm font-semibold text-muted-foreground">{destinationLabel}</Text>
          <Text className="font-poppins-bold text-[22px] leading-7 text-foreground">{recipient}</Text>
          <Text className="text-base text-muted-foreground">{formatAddress(destination)}</Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 gap-0.5 rounded-2xl border border-border bg-card p-3.5">
            <Text className="text-sm font-semibold text-muted-foreground">Cliente</Text>
            <Text className="font-poppins-semibold text-[17px] text-foreground">
              {activeDelivery.tx_customer_name}
            </Text>
            {activeDelivery.tx_customer_phone ? (
              <Text className="text-sm text-muted-foreground">{activeDelivery.tx_customer_phone}</Text>
            ) : null}
          </View>
          <View className="flex-1 gap-0.5 rounded-2xl border border-border bg-card p-3.5">
            <Text className="text-sm font-semibold text-muted-foreground">Você recebe</Text>
            <Text className="font-poppins-bold text-[17px] text-money">
              {brl(activeDelivery.int_delivery_fee_cents)}
            </Text>
            <Text className="text-sm text-muted-foreground">
              pedido de {brl(activeDelivery.int_total_cents)}
            </Text>
          </View>
        </View>

        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      </KeyboardAwareScroll>

      <View className="border-t border-border pb-2 pt-3">
        {status === "READY_FOR_PICKUP" ? (
          <Button label="Retirei o pedido" loading={busy} onPress={() => void handlePickup()} />
        ) : null}
        {status === "PICKED_UP" ? (
          <Button label="Iniciar entrega" loading={busy} onPress={() => void handleStart()} />
        ) : null}
        {status === "DELIVERY" ? (
          <Button label="Confirmar entrega" onPress={() => setCodeModalOpen(true)} />
        ) : null}
      </View>

      <Modal visible={codeModalOpen} transparent animationType="slide">
        <ThemeRoot>
          <View className="flex-1 items-center justify-center bg-black/55 px-4">
            <View className="w-full gap-4 rounded-3xl bg-background p-6">
              <Text className="font-poppins-bold text-xl text-foreground">
                Peça o código de confirmação ao cliente
              </Text>
              <Input
                label="Código"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoFocus
              />
              {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    label="Cancelar"
                    variant="outline"
                    onPress={() => {
                      setCodeModalOpen(false);
                      setError(null);
                    }}
                  />
                </View>
                <View className="flex-[1.4]">
                  <Button label="Confirmar" loading={busy} onPress={() => void handleConfirmCode()} />
                </View>
              </View>
            </View>
          </View>
        </ThemeRoot>
      </Modal>
    </Screen>
  );
}

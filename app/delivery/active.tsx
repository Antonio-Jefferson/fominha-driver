import { useEffect, useState } from "react";
import Constants from "expo-constants";
import * as Location from "expo-location";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { geocodeAddress, type Coordinates } from "../../src/maps/geocodeAddress";
import { getRoute, type Route } from "../../src/maps/getRoute";
import { openNavigation } from "../../src/maps/openNavigation";
import { Modal, ScrollView, Text, View } from "react-native";
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

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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
      setError(err instanceof Error ? err.message : "Código incorreto.");
    } finally {
      setBusy(false);
    }
  }

  const destination =
    activeDelivery.enum_status === "READY_FOR_PICKUP" ? activeDelivery.pickup : activeDelivery.dropoff;
  const destinationLabel =
    activeDelivery.enum_status === "READY_FOR_PICKUP" ? "Retirar em" : "Entregar em";

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-4 pb-10">
        {destinationCoords ? (
          <>
            <View className="h-64 overflow-hidden rounded">
              <MapView
                key={destinationCoords ? `${destinationCoords.latitude},${destinationCoords.longitude}` : "no-destination"}
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
                  <Polyline coordinates={route.points} strokeColor="#F59E0B" strokeWidth={4} />
                ) : null}
                <Marker coordinate={destinationCoords} title={destinationLabel} pinColor="#F59E0B" />
                {driverCoords ? (
                  <Marker coordinate={driverCoords} title="Você" pinColor="#1F1F1F" />
                ) : null}
              </MapView>
            </View>

            {route ? (
              <Text className="text-sm text-muted-foreground">
                {route.distanceText} • {route.durationText}
              </Text>
            ) : null}

            <Button
              label="Navegar"
              variant="outline"
              onPress={() => void openNavigation(destinationCoords)}
            />
          </>
        ) : null}

        <View className="mt-4 gap-1">
          <Text className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {destinationLabel}
          </Text>
          <Text className="text-lg font-bold text-foreground">
            {"name" in destination ? destination.name : activeDelivery.tx_customer_name}
          </Text>
          <Text className="text-base text-muted-foreground">{formatAddress(destination)}</Text>
        </View>

        <View className="gap-1 rounded border border-border bg-card p-4">
          <Text className="text-sm text-muted-foreground">Cliente</Text>
          <Text className="text-base font-semibold text-foreground">{activeDelivery.tx_customer_name}</Text>
          {activeDelivery.tx_customer_phone ? (
            <Text className="text-sm text-muted-foreground">{activeDelivery.tx_customer_phone}</Text>
          ) : null}
        </View>

        <View className="flex-row justify-between rounded border border-border bg-card p-4">
          <Text className="text-sm text-muted-foreground">Total do pedido</Text>
          <Text className="text-base font-bold text-foreground">{brl(activeDelivery.int_total_cents)}</Text>
        </View>
        <View className="flex-row justify-between rounded border border-border bg-card p-4">
          <Text className="text-sm text-muted-foreground">Seu repasse</Text>
          <Text className="text-base font-bold text-foreground">
            {brl(activeDelivery.int_delivery_fee_cents)}
          </Text>
        </View>

        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

        {activeDelivery.enum_status === "READY_FOR_PICKUP" ? (
          <Button label="Retirei o pedido" loading={busy} onPress={() => void handlePickup()} />
        ) : null}
        {activeDelivery.enum_status === "PICKED_UP" ? (
          <Button label="Iniciar entrega" loading={busy} onPress={() => void handleStart()} />
        ) : null}
        {activeDelivery.enum_status === "DELIVERY" ? (
          <Button label="Confirmar entrega" onPress={() => setCodeModalOpen(true)} />
        ) : null}
      </ScrollView>

      <Modal visible={codeModalOpen} transparent animationType="slide">
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full gap-4 rounded bg-background p-6">
            <Text className="text-lg font-bold text-foreground">
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
              <View className="flex-1">
                <Button label="Confirmar" loading={busy} onPress={() => void handleConfirmCode()} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

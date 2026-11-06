import { useState } from "react";
import { LiveMap } from "../../src/maps/LiveMap";
import { openNavigation } from "../../src/maps/openNavigation";
import { routeSummary } from "../../src/maps/routeSummary";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { Bike, MapPin, Navigation } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "../../src/ui/Screen";
import { Input } from "../../src/ui/Input";
import { Button } from "../../src/ui/Button";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";
import {
  completeDelivery,
  confirmDeliveryCode,
  getActiveDelivery,
  getActiveDeliveryMap,
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
  const { data: delivery, isLoading } = useQuery({
    queryKey: ["active-delivery"],
    queryFn: getActiveDelivery,
    refetchInterval: 10_000,
  });
  const { data: map } = useQuery({
    queryKey: ["active-delivery-map", delivery?.enum_status],
    queryFn: getActiveDeliveryMap,
    enabled: Boolean(delivery),
    refetchInterval: 10_000,
  });

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

  async function handleCompleteOwnDelivery() {
    setError(null);
    setBusy(true);
    try {
      await completeDelivery(activeDelivery.id_order);
      await queryClient.invalidateQueries({ queryKey: ["active-delivery"] });
      router.replace("/(tabs)/home");
    } catch (err) {
      // O cliente ou a loja podem ter concluído antes: a próxima leitura tira
      // a corrida da tela. A mensagem explica o que aconteceu até lá.
      setError(err instanceof Error ? err.message : "Não foi possível concluir a entrega.");
      await queryClient.invalidateQueries({ queryKey: ["active-delivery"] });
    } finally {
      setBusy(false);
    }
  }

  function confirmOwnDelivery() {
    Alert.alert("Entregou o pedido?", "O cliente será avisado de que o pedido chegou.", [
      { text: "Ainda não", style: "cancel" },
      { text: "Entreguei", onPress: () => void handleCompleteOwnDelivery() },
    ]);
  }

  const isOwnDelivery = activeDelivery.enum_delivery_mode === "RESTAURANT_OWN";

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
        {map?.target ? (
          <View className="h-72 overflow-hidden rounded-3xl">
            <LiveMap
              testID="delivery-map"
              style={{ flex: 1 }}
              courier={map.courier}
              destination={map.target}
              route={map.route}
              routeColor={p.primary}
              courierMarker={
                <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-deck">
                  <Bike size={20} color={p.primary} />
                </View>
              }
              destinationMarker={<MapPin size={36} color={p.primary} fill={p.foreground} />}
            />
            {map.route ? (
              <View className="absolute bottom-3 left-3 h-10 flex-row items-center rounded-full bg-card px-3.5">
                <Text className="text-sm font-bold text-foreground">{routeSummary(map.route)}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Navegar"
              onPress={() => {
                const target = map.target;
                if (!target) return;
                void openNavigation(target).catch(() =>
                  setError("Não foi possível abrir o app de navegação.")
                );
              }}
              className="absolute bottom-3 right-3 h-12 flex-row items-center gap-2 rounded-full bg-deck px-4 active:opacity-80"
            >
              <Navigation size={18} color={p.primary} />
              <Text className="text-[15px] font-semibold text-deck-foreground">Navegar</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Motoboy da loja já sai com o pedido: as etapas de retirada não existem. */}
        {isOwnDelivery ? null : <StepTracker status={status} />}

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
            {isOwnDelivery ? (
              // A taxa do motoboy da loja é combinada com a loja, não passa pelo app.
              <>
                <Text className="text-sm font-semibold text-muted-foreground">Pagamento</Text>
                <Text className="font-poppins-bold text-[17px] text-money">
                  {activeDelivery.enum_payment_method === "CASH"
                    ? `Cobrar ${brl(activeDelivery.int_total_cents)}`
                    : "Já pago"}
                </Text>
              </>
            ) : (
              <>
                <Text className="text-sm font-semibold text-muted-foreground">Você recebe</Text>
                <Text className="font-poppins-bold text-[17px] text-money">
                  {brl(activeDelivery.int_delivery_fee_cents)}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  pedido de {brl(activeDelivery.int_total_cents)}
                </Text>
              </>
            )}
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
        {status === "DELIVERY" && isOwnDelivery ? (
          <Button label="Entreguei o pedido" loading={busy} onPress={confirmOwnDelivery} />
        ) : null}
        {status === "DELIVERY" && !isOwnDelivery ? (
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

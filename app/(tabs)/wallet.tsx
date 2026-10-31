import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "../../src/ui/Screen";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";
import { BalanceCard } from "../../src/ui/BalanceCard";
import { LedgerRow } from "../../src/ui/LedgerRow";
import { brl } from "../../src/lib/money";
import { getBalance, requestWithdrawal } from "../../src/api/wallet";

const MIN_WITHDRAWAL_CENTS = 2000;

export default function WalletScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: balance, isLoading } = useQuery({
    queryKey: ["driver-balance"],
    queryFn: getBalance,
  });

  async function handleWithdraw() {
    setError(null);
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);

    if (!cents || Number.isNaN(cents)) {
      setError("Informe um valor válido.");
      return;
    }
    if (cents < MIN_WITHDRAWAL_CENTS) {
      setError(`Valor mínimo para saque: ${brl(MIN_WITHDRAWAL_CENTS)}`);
      return;
    }

    setSubmitting(true);
    try {
      await requestWithdrawal(cents);
      setAmount("");
      await queryClient.invalidateQueries({ queryKey: ["driver-balance"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível solicitar o saque.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || !balance) return <LoadingSpinner />;

  return (
    <Screen>
      <FlatList
        data={balance.recent_entries}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
        ListHeaderComponent={
          <View className="gap-5 pb-4 pt-2">
            <Text className="font-poppins-extrabold text-[28px] leading-9 text-foreground">
              Carteira
            </Text>
            <BalanceCard
              availableCents={balance.available_cents}
              pendingCents={balance.pending_cents}
              inReviewCents={balance.in_review_cents}
              amount={amount}
              onAmountChange={setAmount}
              onSubmit={() => void handleWithdraw()}
              submitting={submitting}
              error={error}
            />
            <View className="flex-row items-center justify-between">
              <Text className="font-poppins-bold text-lg text-foreground">Extrato</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/withdrawals")}
                className="min-h-11 justify-center active:opacity-60"
              >
                <Text className="text-[15px] font-semibold text-primary-text">
                  Histórico de saques
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => <LedgerRow entry={item} />}
        ListEmptyComponent={
          <Text className="py-6 text-center text-base text-muted-foreground">
            Seus ganhos aparecem aqui depois da primeira entrega.
          </Text>
        }
      />
    </Screen>
  );
}

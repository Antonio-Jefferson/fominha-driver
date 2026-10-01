import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "../../src/ui/Screen";
import { Input } from "../../src/ui/Input";
import { Button } from "../../src/ui/Button";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";
import { getBalance, requestWithdrawal } from "../../src/api/wallet";

const MIN_WITHDRAWAL_CENTS = 2000;

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const ENTRY_LABEL: Record<string, string> = {
  DRIVER_EARNING: "Ganho de entrega",
  WITHDRAWAL: "Saque",
};

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
      <View className="mt-4 gap-2 rounded border border-border bg-card p-4">
        <Text className="text-sm text-muted-foreground">Disponível para saque</Text>
        <Text className="text-3xl font-extrabold text-foreground">
          {brl(balance.available_cents)}
        </Text>
        <View className="flex-row justify-between">
          <Text className="text-sm text-muted-foreground">
            Pendente: {brl(balance.pending_cents)}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Em análise: {brl(balance.in_review_cents)}
          </Text>
        </View>
      </View>

      <View className="mt-4 gap-3">
        <Input
          label="Valor do saque"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0,00"
        />
        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
        <Button label="Solicitar saque" loading={submitting} onPress={() => void handleWithdraw()} />
        <Button
          label="Ver histórico de saques"
          variant="ghost"
          onPress={() => router.push("/withdrawals")}
        />
      </View>

      <View className="mt-6 flex-1">
        <Text className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Extrato
        </Text>
        <FlatList
          data={balance.recent_entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between border-b border-border py-3">
              <View>
                <Text className="text-base text-foreground">
                  {ENTRY_LABEL[item.type] ?? item.type}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {new Date(item.occurred_at).toLocaleDateString("pt-BR")}
                </Text>
              </View>
              <Text
                className={`text-base font-semibold ${
                  item.amount_cents < 0 ? "text-destructive" : "text-foreground"
                }`}
              >
                {brl(item.amount_cents)}
              </Text>
            </View>
          )}
        />
      </View>
    </Screen>
  );
}

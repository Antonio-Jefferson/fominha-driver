import { FlatList, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "../src/ui/Screen";
import { EmptyState } from "../src/ui/EmptyState";
import { LoadingSpinner } from "../src/ui/LoadingSpinner";
import { listWithdrawals } from "../src/api/wallet";

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Solicitado",
  APPROVED: "Aprovado",
  PAID: "Pago",
  REJECTED: "Rejeitado",
  CANCELLED: "Cancelado",
};

export default function WithdrawalsScreen() {
  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["driver-withdrawals"],
    queryFn: listWithdrawals,
  });

  if (isLoading) return <LoadingSpinner />;

  if (!withdrawals || withdrawals.length === 0) {
    return (
      <Screen>
        <EmptyState title="Nenhum saque ainda" description="Seus saques solicitados aparecem aqui." />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={withdrawals}
        keyExtractor={(item) => item.id_withdrawal}
        contentContainerClassName="pt-4"
        renderItem={({ item }) => (
          <View className="mb-3 flex-row items-center justify-between rounded border border-border bg-card p-4">
            <View>
              <Text className="text-base font-semibold text-foreground">
                {brl(item.int_amount_cents)}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {new Date(item.dt_requested_at).toLocaleDateString("pt-BR")}
              </Text>
            </View>
            <Text className="text-sm font-semibold text-muted-foreground">
              {STATUS_LABEL[item.enum_status] ?? item.enum_status}
            </Text>
          </View>
        )}
      />
    </Screen>
  );
}

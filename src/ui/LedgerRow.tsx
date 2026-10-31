import { Text, View } from "react-native";
import { brl } from "../lib/money";
import type { DriverBalance } from "../@types/driver";

export const ENTRY_LABEL: Record<string, string> = {
  DRIVER_EARNING: "Ganho de entrega",
  WITHDRAWAL: "Saque",
};

export function formatSigned(cents: number): string {
  return `${cents < 0 ? "−" : "+"} ${brl(Math.abs(cents))}`;
}

export function LedgerRow({ entry }: { entry: DriverBalance["recent_entries"][number] }) {
  return (
    <View className="min-h-16 flex-row items-center justify-between gap-3 border-b border-border py-3">
      <View className="flex-1">
        <Text className="text-base font-medium text-foreground">
          {ENTRY_LABEL[entry.type] ?? entry.type}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {new Date(entry.occurred_at).toLocaleDateString("pt-BR")}
        </Text>
      </View>
      <Text
        className={`font-poppins-bold text-base ${
          entry.amount_cents < 0 ? "text-foreground" : "text-money"
        }`}
      >
        {formatSigned(entry.amount_cents)}
      </Text>
    </View>
  );
}

import { Text, TextInput, View } from "react-native";
import { Button } from "./Button";
import { usePalette } from "./theme";
import { brl } from "../lib/money";

export function BalanceCard({
  availableCents,
  pendingCents,
  inReviewCents,
  amount,
  onAmountChange,
  onSubmit,
  submitting,
  error,
}: {
  availableCents: number;
  pendingCents: number;
  inReviewCents: number;
  amount: string;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const p = usePalette();

  return (
    <View className="gap-1.5 rounded-[28px] border border-deck-border bg-deck p-5">
      <Text className="text-sm font-semibold text-deck-muted">Disponível para saque</Text>
      <Text className="font-poppins-extrabold text-[40px] leading-[48px] text-deck-foreground">
        {brl(availableCents)}
      </Text>

      <View className="mt-1 flex-row flex-wrap gap-2">
        <View className="rounded-full bg-deck-foreground/10 px-3 py-1.5">
          <Text className="text-[13px] text-deck-muted">
            Pendente{" "}
            <Text className="font-semibold text-deck-foreground">{brl(pendingCents)}</Text>
          </Text>
        </View>
        <View className="rounded-full bg-deck-foreground/10 px-3 py-1.5">
          <Text className="text-[13px] text-deck-muted">
            Em análise{" "}
            <Text className="font-semibold text-deck-foreground">{brl(inReviewCents)}</Text>
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row gap-3">
        <View className="h-14 flex-1 flex-row items-center gap-1.5 rounded-2xl border border-deck-foreground/20 bg-deck-foreground/10 px-4">
          <Text className="text-[15px] text-deck-muted">R$</Text>
          <TextInput
            accessibilityLabel="Valor do saque"
            value={amount}
            onChangeText={onAmountChange}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor={p.deckMuted}
            className="flex-1 font-poppins-semibold text-lg text-deck-foreground"
          />
        </View>
        <View className="w-28">
          <Button label="Sacar" height="h-14" loading={submitting} onPress={onSubmit} />
        </View>
      </View>

      {error ? (
        <Text accessibilityRole="alert" className="mt-1 text-sm font-semibold text-deck-foreground">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

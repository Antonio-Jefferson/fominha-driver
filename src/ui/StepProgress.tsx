import { Text, View } from "react-native";

export function StepProgress({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-bold tracking-wider text-primary">
        PASSO {step} DE {total}
      </Text>
      <View className="flex-row gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < step ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </View>
    </View>
  );
}

import { Text, View } from "react-native";
import type { OrderStatus } from "../@types/driver";

const STEPS = ["Retirar", "Levar", "Entregar"] as const;

export function currentStep(status: OrderStatus): 1 | 2 | 3 {
  if (status === "PICKED_UP") return 2;
  if (status === "DELIVERY") return 3;
  return 1;
}

export function StepTracker({ status }: { status: OrderStatus }) {
  const step = currentStep(status);

  return (
    <View
      accessible
      accessibilityLabel={`Passo ${step} de 3: ${STEPS[step - 1]}`}
      className="flex-row items-center gap-2"
    >
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <View key={label} className="flex-1 flex-row items-center gap-2">
            <View
              className={`h-7 w-7 items-center justify-center rounded-full ${
                active || done ? "bg-primary" : "bg-muted"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  active || done ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {done ? "✓" : n}
              </Text>
            </View>
            <Text
              className={`text-sm ${active ? "font-bold text-foreground" : "text-muted-foreground"}`}
            >
              {label}
            </Text>
            {n < 3 ? <View className="h-0.5 flex-1 rounded-full bg-border" /> : null}
          </View>
        );
      })}
    </View>
  );
}

import { Pressable, Text, View } from "react-native";

export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            className={`h-11 items-center justify-center rounded-full border px-5 ${
              selected ? "border-primary bg-primary" : "border-border bg-background"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                selected ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

import { Pressable, Text, View } from "react-native";
import { CircleCheck, MapPin } from "lucide-react-native";
import { usePalette } from "./theme";

export function CityRadioList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (city: T) => void;
}) {
  const p = usePalette();
  return (
    <View className="gap-2">
      {options.map((option) => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            className={`h-14 flex-row items-center justify-between rounded-2xl border px-4 ${
              selected ? "border-primary bg-muted" : "border-border bg-background"
            }`}
          >
            <View className="flex-row items-center gap-2">
              <MapPin color={selected ? p.primaryText : p.mutedForeground} size={18} />
              <Text
                className={`text-base text-foreground ${
                  selected ? "font-bold" : "font-normal"
                }`}
              >
                {option}
              </Text>
            </View>
            {selected ? <CircleCheck color={p.money} size={20} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

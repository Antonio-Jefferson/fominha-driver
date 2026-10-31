import type { ComponentType, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { usePalette } from "./theme";

type IconComponent = ComponentType<{ size?: number; color?: string }>;

export function ListGroup({ children }: { children: ReactNode }) {
  return (
    <View className="overflow-hidden rounded-3xl border border-border bg-card">
      {children}
    </View>
  );
}

export function ListRow({
  icon: Icon,
  label,
  onPress,
  chevron = true,
  last = false,
}: {
  icon: IconComponent;
  label: string;
  onPress: () => void;
  chevron?: boolean;
  last?: boolean;
}) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`min-h-14 flex-row items-center gap-3 px-4 py-3 active:opacity-70 ${
        last ? "" : "border-b border-border"
      }`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-muted">
        <Icon size={20} color={p.foreground} />
      </View>
      <Text className="flex-1 text-base font-medium text-foreground">{label}</Text>
      {chevron ? <ChevronRight size={20} color={p.mutedForeground} /> : null}
    </Pressable>
  );
}

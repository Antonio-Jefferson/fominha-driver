import type { ComponentType } from "react";
import { View } from "react-native";
import { usePalette } from "./theme";

export function IconBadge({
  icon: Icon,
}: {
  icon: ComponentType<{ size?: number; color?: string }>;
}) {
  const p = usePalette();
  return (
    <View className="h-14 w-14 items-center justify-center rounded-full bg-muted">
      <Icon color={p.primaryText} size={26} />
    </View>
  );
}

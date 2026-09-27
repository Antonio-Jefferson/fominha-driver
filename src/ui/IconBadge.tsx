import type { ComponentType } from "react";
import { View } from "react-native";

export function IconBadge({
  icon: Icon,
}: {
  icon: ComponentType<{ size?: number; color?: string }>;
}) {
  return (
    <View className="h-14 w-14 items-center justify-center rounded-full bg-muted">
      <Icon color="#F59E0B" size={26} />
    </View>
  );
}

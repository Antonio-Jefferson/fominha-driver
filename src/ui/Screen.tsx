import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({
  children,
  className = "bg-background",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <SafeAreaView className={`flex-1 ${className}`}>
      <View className="flex-1 px-5">{children}</View>
    </SafeAreaView>
  );
}

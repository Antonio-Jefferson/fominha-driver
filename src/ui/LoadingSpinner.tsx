import { ActivityIndicator, View } from "react-native";
import { usePalette } from "./theme";

export function LoadingSpinner() {
  const p = usePalette();
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={p.primary} />
    </View>
  );
}

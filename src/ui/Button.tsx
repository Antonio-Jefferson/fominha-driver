import type { ComponentType } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Variant = "primary" | "outline" | "ghost";
type IconComponent = ComponentType<{ size?: number; color?: string }>;

const VARIANT_STYLES: Record<
  Variant,
  { container: string; label: string; iconColor: string }
> = {
  primary: {
    container: "bg-primary active:opacity-80",
    label: "text-primary-foreground",
    iconColor: "#1F1F1F",
  },
  outline: {
    container: "border border-border bg-transparent active:opacity-80",
    label: "text-foreground",
    iconColor: "#1F1F1F",
  },
  ghost: {
    container: "bg-transparent active:opacity-60",
    label: "text-primary",
    iconColor: "#F59E0B",
  },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  rounded = "rounded",
  height = "h-12",
  textSize = "text-base",
  icon: Icon,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  /** Classe de border-radius do NativeWind, ex.: "rounded-full". */
  rounded?: string;
  /** Classe de altura do NativeWind, ex.: "h-14". */
  height?: string;
  /** Classe de tamanho de fonte do NativeWind, ex.: "text-lg". */
  textSize?: string;
  icon?: IconComponent;
}) {
  const isInactive = loading || disabled;
  const styles = VARIANT_STYLES[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={onPress}
      className={`${height} flex-row items-center justify-center px-4 ${rounded} ${styles.container} ${
        isInactive ? "opacity-50" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator color={styles.iconColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          <Text className={`${textSize} font-semibold ${styles.label}`}>{label}</Text>
          {Icon ? <Icon size={18} color={styles.iconColor} /> : null}
        </View>
      )}
    </Pressable>
  );
}

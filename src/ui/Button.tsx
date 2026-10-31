import type { ComponentType } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { usePalette, type Tokens } from "./theme";

type Variant = "primary" | "outline" | "ghost" | "destructive";
type IconComponent = ComponentType<{ size?: number; color?: string }>;

const VARIANT_STYLES: Record<Variant, { container: string; label: string }> = {
  primary: {
    container: "bg-primary active:opacity-80",
    label: "text-primary-foreground",
  },
  outline: {
    container: "border-2 border-border bg-transparent active:opacity-70",
    label: "text-foreground",
  },
  ghost: {
    container: "bg-transparent active:opacity-60",
    label: "text-primary-text",
  },
  destructive: {
    container: "bg-destructive active:opacity-80",
    label: "text-destructive-foreground",
  },
};

/** Principal 64 pt; os demais 56 pt. */
const DEFAULT_HEIGHT: Record<Variant, string> = {
  primary: "h-16",
  outline: "h-14",
  ghost: "h-14",
  destructive: "h-14",
};

function contentColor(variant: Variant, p: Tokens): string {
  switch (variant) {
    case "primary":
      return p.primaryForeground;
    case "outline":
      return p.foreground;
    case "ghost":
      return p.primaryText;
    case "destructive":
      return p.destructiveForeground;
  }
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  rounded = "rounded-2xl",
  height,
  textSize = "text-[17px]",
  icon: Icon,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  /** Classe de border-radius do NativeWind, ex.: "rounded-full". */
  rounded?: string;
  /** Classe de altura do NativeWind, ex.: "h-14". Padrão: 64 pt no primário, 56 pt nos demais. */
  height?: string;
  /** Classe de tamanho de fonte do NativeWind, ex.: "text-lg". */
  textSize?: string;
  icon?: IconComponent;
}) {
  const p = usePalette();
  const isInactive = loading || disabled;
  const styles = VARIANT_STYLES[variant];
  const color = contentColor(variant, p);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={onPress}
      className={`${height ?? DEFAULT_HEIGHT[variant]} flex-row items-center justify-center px-4 ${rounded} ${styles.container} ${
        isInactive ? "opacity-50" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View className="flex-row items-center gap-2">
          <Text className={`${textSize} font-poppins-semibold ${styles.label}`}>{label}</Text>
          {Icon ? <Icon size={20} color={color} /> : null}
        </View>
      )}
    </Pressable>
  );
}

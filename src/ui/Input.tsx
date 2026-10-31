import { useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { usePalette } from "./theme";

export function Input({
  label,
  error,
  className,
  rounded = "rounded-2xl",
  height = "h-14",
  secureTextEntry,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  /** Classe de border-radius do NativeWind, ex.: "rounded-full". */
  rounded?: string;
  /** Classe de altura do NativeWind, ex.: "h-14". */
  height?: string;
}) {
  const p = usePalette();
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-muted-foreground">{label}</Text>
      <View className="justify-center">
        <TextInput
          placeholderTextColor={p.mutedForeground}
          {...props}
          secureTextEntry={isPassword && !visible}
          accessibilityLabel={label}
          className={`${height} ${rounded} border-2 bg-card px-4 text-[17px] text-foreground ${
            isPassword ? "pr-12" : ""
          } ${error ? "border-destructive" : "border-border"} ${className ?? ""}`}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
            onPress={() => setVisible((v) => !v)}
            hitSlop={12}
            className="absolute right-2 h-11 w-11 items-center justify-center"
          >
            {visible ? (
              <EyeOff size={20} color={p.mutedForeground} />
            ) : (
              <Eye size={20} color={p.mutedForeground} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
    </View>
  );
}

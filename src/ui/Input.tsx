import { useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

export function Input({
  label,
  error,
  className,
  rounded = "rounded",
  height = "h-12",
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
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View className="gap-1.5">
      <Text className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </Text>
      <View className="justify-center">
        <TextInput
          placeholderTextColor="#6B7280"
          {...props}
          secureTextEntry={isPassword && !visible}
          accessibilityLabel={label}
          className={`${height} ${rounded} border px-4 text-base text-foreground ${
            isPassword ? "pr-11" : ""
          } ${error ? "border-destructive" : "border-border"} ${className ?? ""}`}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            className="absolute right-3"
          >
            {visible ? (
              <EyeOff size={20} color="#6B7280" />
            ) : (
              <Eye size={20} color="#6B7280" />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}

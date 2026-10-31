import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import type { NativeStackHeaderProps } from "expo-router";
import { usePalette } from "./theme";

/**
 * Cabeçalho das telas de autenticação (cadastro, recuperar senha): fundo
 * branco contínuo com o `Screen`, seta de voltar num círculo creme claro.
 * Fica restrito ao stack `(auth)` — o `AppHeader` genérico usado no resto do
 * app não muda.
 */
export function AuthHeader({ navigation, options, back }: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();
  const p = usePalette();
  const title = options.title ?? "";

  return (
    <View style={{ paddingTop: insets.top }} className="bg-background">
      <View className="h-14 flex-row items-center gap-3 px-5">
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => navigation.goBack()}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full bg-muted active:opacity-60"
          >
            <ArrowLeft color={p.foreground} size={20} />
          </Pressable>
        ) : (
          <View className="h-11 w-11" />
        )}
        {title ? (
          <Text
            numberOfLines={1}
            className="flex-1 text-lg font-bold text-foreground"
          >
            {title}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

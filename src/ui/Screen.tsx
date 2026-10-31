import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  KeyboardAwareScroll,
} from "./KeyboardAwareScroll";

/**
 * `keyboard`:
 * - "scroll": o conteúdo rola e o campo focado sobe acima do teclado
 *   (formulários sem ScrollView próprio).
 * - "avoid": o conteúdo encolhe para o teclado (chat, com campo fixo no rodapé).
 */
export function Screen({
  children,
  className = "bg-background",
  keyboard,
}: {
  children: ReactNode;
  className?: string;
  keyboard?: "scroll" | "avoid";
}) {
  let content = <View className="flex-1 px-5">{children}</View>;

  if (keyboard === "scroll") {
    content = (
      <KeyboardAwareScroll
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="grow px-5"
      >
        {children}
      </KeyboardAwareScroll>
    );
  } else if (keyboard === "avoid") {
    content = (
      <KeyboardAvoidingView behavior="padding" className="flex-1 px-5">
        {children}
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${className}`}>{content}</SafeAreaView>
  );
}

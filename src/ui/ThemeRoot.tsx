import type { ReactNode } from "react";
import { View } from "react-native";
import { vars } from "nativewind";
import { SchemeContext, cssVars, useScheme, type Scheme } from "./theme";

/**
 * Aplica as variáveis de cor do tema e informa o tema atual a `usePalette`.
 * `scheme` força um tema (prévia e testes); sem ele segue o do sistema.
 */
export function ThemeRoot({
  scheme,
  children,
}: {
  scheme?: Scheme;
  children: ReactNode;
}) {
  const inherited = useScheme();
  const active = scheme ?? inherited;
  return (
    <SchemeContext.Provider value={active}>
      <View className="flex-1" style={vars(cssVars(active))}>
        {children}
      </View>
    </SchemeContext.Provider>
  );
}

# Redesign do app do entregador Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o visual das telas do fominha-driver pela direção "painel de bordo" (claro e escuro, Poppins, alvos de toque grandes) sem mudar nenhuma lógica, e fazer o back mandar restaurante e bairros na oferta.

**Architecture:** As cores viram variáveis CSS do NativeWind (`vars`) definidas por um `ThemeRoot` na raiz; o `tailwind.config.js` aponta cada cor para a variável. Assim as classes que já existem (`text-foreground`, `bg-card`…) trocam de tema sem editar cada tela. `usePalette()` cobre ícones e marcadores de mapa. Componentes novos em `src/ui/`; as telas só trocam JSX e classes, hooks e handlers ficam onde estão.

**Tech Stack:** Expo 57, React Native 0.86, NativeWind 4, expo-router, react-native-svg, lucide-react-native, Poppins (`@expo-google-fonts/poppins`), Jest + @testing-library/react-native. Back: NestJS + Prisma.

**Spec:** `docs/superpowers/specs/2026-10-31-redesign-app-entregador-design.md`. Protótipo aprovado: https://claude.ai/artifact/DJaVoKvSs56hnwTEp2KAgX

**Regras de execução**
- Trabalhar na `main` do fominha-driver e do fominha-back. Commits locais, sem push (o usuário decide).
- Rodar **um arquivo de teste por chamada**: `npx jest <caminho>`.
- Não mexer em: `src/driver/*`, `src/auth/*`, `src/api/*`, `src/maps/*`, `src/push/*`, nem em handlers e hooks das telas.
- Tamanhos: botão principal 64 pt (`h-16`), secundário 56 pt (`h-14`), nada tocável abaixo de 44 pt, nada de texto abaixo de 12 pt.

---

## Mapa de arquivos

**Criar (driver)**
- `src/ui/theme.ts` paletas, `usePalette`, `useScheme`, `cssVars`, `contrastRatio`
- `src/ui/ThemeRoot.tsx` injeta variáveis CSS e o tema
- `src/ui/fonts.ts` mapa das fontes Poppins
- `src/lib/money.ts` `brl`
- `src/ui/Avatar.tsx`, `src/ui/ListGroup.tsx` (`ListGroup`, `ListRow`)
- `src/ui/CountdownRing.tsx`, `src/ui/RouteLegs.tsx`, `src/ui/OfferSheet.tsx`
- `src/ui/StateCard.tsx`, `src/ui/StepTracker.tsx`
- `src/ui/BalanceCard.tsx`, `src/ui/LedgerRow.tsx`
- um `*.test.ts(x)` ao lado de cada um acima

**Modificar (driver)**
- `app.json`, `package.json` (dependências), `tailwind.config.js`, `global.css`
- `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
- `app/(tabs)/home.tsx`, `app/delivery/active.tsx`, `app/(tabs)/wallet.tsx`, `app/(tabs)/profile.tsx`
- `src/ui/Button.tsx`, `Input.tsx`, `EmptyState.tsx`, `LoadingSpinner.tsx`
- `src/@types/driver.ts` (campos opcionais da oferta)
- demais arquivos com cor escrita direto (Task 14)

**Back (fominha-back)**
- Criar `src/delivery/infra/http/offer-view.ts` e `offer-view.spec.ts`
- Modificar `src/delivery/infra/http/delivery.controller.ts` (`listOffers`)

---

### Task 1: Dependências e configuração de tema do sistema

**Files:**
- Modify: `package.json`, `package-lock.json` (via expo install)
- Modify: `app.json:8`

- [ ] **Step 1: Instalar fonte**

Run: `cd /home/antonio/the-code/fominha/fominha-driver && npx expo install expo-font @expo-google-fonts/poppins`
Expected: termina sem erro; `package.json` passa a listar `expo-font` e `@expo-google-fonts/poppins`.

- [ ] **Step 2: Ligar o tema automático**

Em `app.json`, trocar `"userInterfaceStyle": "light"` por `"userInterfaceStyle": "automatic"`.

- [ ] **Step 3: Conferir que `app.config.js` não sobrescreve**

Run: `grep -n "userInterfaceStyle" app.config.js app.json`
Expected: só `app.json` com `automatic`. Se `app.config.js` também definir, trocar lá.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json app.json
git commit -m "chore(driver): poppins e tema automatico claro/escuro"
```

---

### Task 2: Tokens de tema

**Files:**
- Create: `src/ui/theme.ts`, `src/ui/theme.test.ts`, `src/ui/ThemeRoot.tsx`
- Modify: `tailwind.config.js`, `global.css`

- [ ] **Step 1: Escrever o teste**

`src/ui/theme.test.ts`:

```ts
import { contrastRatio, cssVars, hexToChannels, palette } from "./theme";

describe("palette", () => {
  it("tem as mesmas chaves nos dois temas", () => {
    expect(Object.keys(palette.dark).sort()).toEqual(Object.keys(palette.light).sort());
  });

  it("converte hex em canais rgb", () => {
    expect(hexToChannels("#F59E0B")).toBe("245 158 11");
  });

  it("gera variáveis css em kebab-case", () => {
    const vars = cssVars("light");
    expect(vars["--muted-foreground"]).toBe(hexToChannels(palette.light.mutedForeground));
    expect(vars["--primary-text"]).toBe(hexToChannels(palette.light.primaryText));
    expect(vars["--deck-border"]).toBeDefined();
  });
});

describe.each(["light", "dark"] as const)("contraste de texto no tema %s", (scheme) => {
  const t = palette[scheme];
  const pairs: Array<[string, string, string]> = [
    ["foreground no fundo", t.foreground, t.background],
    ["foreground no card", t.foreground, t.card],
    ["mutedForeground no fundo", t.mutedForeground, t.background],
    ["mutedForeground no card", t.mutedForeground, t.card],
    ["mutedForeground no muted", t.mutedForeground, t.muted],
    ["primaryText no fundo", t.primaryText, t.background],
    ["primaryText no card", t.primaryText, t.card],
    ["primaryForeground no primary", t.primaryForeground, t.primary],
    ["money no fundo", t.money, t.background],
    ["money no card", t.money, t.card],
    ["destructive no fundo", t.destructive, t.background],
    ["destructiveForeground no destructive", t.destructiveForeground, t.destructive],
    ["deckForeground no deck", t.deckForeground, t.deck],
    ["deckMuted no deck", t.deckMuted, t.deck],
  ];

  it.each(pairs)("%s passa de 4,5:1", (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/ui/theme.test.ts`
Expected: FAIL (`Cannot find module './theme'`).

- [ ] **Step 3: Implementar `src/ui/theme.ts`**

```ts
import { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

export type Scheme = "light" | "dark";

export interface Tokens {
  background: string;
  foreground: string;
  card: string;
  muted: string;
  mutedForeground: string;
  border: string;
  primary: string;
  primaryForeground: string;
  primaryText: string;
  destructive: string;
  destructiveForeground: string;
  deck: string;
  deckForeground: string;
  deckMuted: string;
  deckBorder: string;
  money: string;
}

export const palette: Record<Scheme, Tokens> = {
  light: {
    background: "#FFFDF8",
    foreground: "#1F1F1F",
    card: "#FFFFFF",
    muted: "#F3EEE5",
    mutedForeground: "#6E6A66",
    border: "#EFE7D9",
    primary: "#F59E0B",
    primaryForeground: "#1F1F1F",
    primaryText: "#B45309",
    destructive: "#B3261E",
    destructiveForeground: "#FFFFFF",
    deck: "#1F1F1F",
    deckForeground: "#FFF6E5",
    deckMuted: "#CFC6B8",
    deckBorder: "#1F1F1F",
    money: "#2E7D32",
  },
  dark: {
    background: "#121110",
    foreground: "#FFF6E5",
    card: "#1D1B19",
    muted: "#2A2622",
    mutedForeground: "#B5AEA4",
    border: "#312D28",
    primary: "#F59E0B",
    primaryForeground: "#1F1F1F",
    primaryText: "#F59E0B",
    destructive: "#F2857B",
    destructiveForeground: "#1F1F1F",
    deck: "#1D1B19",
    deckForeground: "#FFF6E5",
    deckMuted: "#B5AEA4",
    deckBorder: "#312D28",
    money: "#7CC47F",
  },
};

export function hexToChannels(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Variáveis css (`--muted-foreground`: "110 106 102") para o `vars()` do NativeWind. */
export function cssVars(scheme: Scheme): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(palette[scheme])) {
    const name = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    out[`--${name}`] = hexToChannels(value);
  }
  return out;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToChannels(hex)
    .split(" ")
    .map((v) => {
      const c = Number(v) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG entre duas cores hex. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const SchemeContext = createContext<Scheme | null>(null);

export function useScheme(): Scheme {
  const forced = useContext(SchemeContext);
  const system = useColorScheme();
  return forced ?? (system === "dark" ? "dark" : "light");
}

export function usePalette(): Tokens {
  return palette[useScheme()];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/ui/theme.test.ts`
Expected: PASS. Se algum par de contraste falhar, ajustar **o hex do token** (não o limite) e repetir; registrar o valor final no commit.

- [ ] **Step 5: Criar `src/ui/ThemeRoot.tsx`**

```tsx
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
```

- [ ] **Step 6: Apontar o Tailwind para as variáveis**

Substituir `tailwind.config.js` por:

```js
/** @type {import('tailwindcss').Config} */
const channel = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: channel("background"),
        foreground: channel("foreground"),
        card: channel("card"),
        border: channel("border"),
        money: channel("money"),
        muted: { DEFAULT: channel("muted"), foreground: channel("muted-foreground") },
        primary: {
          DEFAULT: channel("primary"),
          foreground: channel("primary-foreground"),
          text: channel("primary-text"),
        },
        destructive: {
          DEFAULT: channel("destructive"),
          foreground: channel("destructive-foreground"),
        },
        deck: {
          DEFAULT: channel("deck"),
          foreground: channel("deck-foreground"),
          muted: channel("deck-muted"),
          border: channel("deck-border"),
        },
      },
      fontFamily: {
        poppins: ["Poppins_400Regular"],
        "poppins-medium": ["Poppins_500Medium"],
        "poppins-semibold": ["Poppins_600SemiBold"],
        "poppins-bold": ["Poppins_700Bold"],
        "poppins-extrabold": ["Poppins_800ExtraBold"],
      },
      borderRadius: {
        DEFAULT: "10px",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 7: Valores de reserva em `global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 255 253 248;
  --foreground: 31 31 31;
  --card: 255 255 255;
  --muted: 243 238 229;
  --muted-foreground: 110 106 102;
  --border: 239 231 217;
  --primary: 245 158 11;
  --primary-foreground: 31 31 31;
  --primary-text: 180 83 9;
  --destructive: 179 38 30;
  --destructive-foreground: 255 255 255;
  --deck: 31 31 31;
  --deck-foreground: 255 246 229;
  --deck-muted: 207 198 184;
  --deck-border: 31 31 31;
  --money: 46 125 50;
}
```

- [ ] **Step 8: Conferir que classes antigas de sombra "dark" não existem**

Run: `grep -rnE "(bg|text|border)-[a-z-]+-dark" app src --include=*.tsx`
Expected: nenhuma linha. Se houver, trocar pela classe sem `-dark` (o tema agora vem das variáveis).

- [ ] **Step 9: Commit**

```bash
git add src/ui/theme.ts src/ui/theme.test.ts src/ui/ThemeRoot.tsx tailwind.config.js global.css
git commit -m "feat(driver): tokens de tema claro/escuro via variaveis css"
```

---

### Task 3: Fontes e raiz do app

**Files:**
- Create: `src/ui/fonts.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Criar `src/ui/fonts.ts`**

```ts
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";

export const poppinsFonts = {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
};
```

- [ ] **Step 2: Atualizar `app/_layout.tsx`**

Trocar os imports/trecho do componente por (mantendo o `<Stack>` e as demais telas exatamente como estão):

```tsx
import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Toast from "react-native-toast-message";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "../src/auth/AuthContext";
import { DriverProvider } from "../src/driver/DriverContext";
import { queryClient } from "../src/lib/query-client";
import { usePushHandlers } from "../src/push/usePushHandlers";
import { ThemeRoot } from "../src/ui/ThemeRoot";
import { poppinsFonts } from "../src/ui/fonts";

SplashScreen.preventAutoHideAsync();

function PushBridge() {
  usePushHandlers();
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(poppinsFonts);
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeRoot>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <DriverProvider>
                <StatusBar style="auto" />
                <PushBridge />
                {/* <Stack> e <Toast /> continuam exatamente como estavam */}
              </DriverProvider>
            </AuthProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </ThemeRoot>
    </SafeAreaProvider>
  );
}
```

Atenção: o comentário acima marca onde o `<Stack ...>…</Stack>` e o `<Toast />` originais permanecem; ao editar, **manter essas linhas do arquivo original**, só trocando o que está listado.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros novos.

- [ ] **Step 4: Commit**

```bash
git add src/ui/fonts.ts app/_layout.tsx
git commit -m "feat(driver): carrega poppins e aplica tema na raiz"
```

---

### Task 4: Formatação de dinheiro

**Files:**
- Create: `src/lib/money.ts`, `src/lib/money.test.ts`

- [ ] **Step 1: Teste**

```ts
import { brl } from "./money";

describe("brl", () => {
  it("formata centavos em reais", () => {
    expect(brl(850).replace(/ /g, " ")).toBe("R$ 8,50");
    expect(brl(0).replace(/ /g, " ")).toBe("R$ 0,00");
    expect(brl(18640).replace(/ /g, " ")).toBe("R$ 186,40");
  });
});
```

- [ ] **Step 2:** Run: `npx jest src/lib/money.test.ts` → FAIL (módulo não existe).

- [ ] **Step 3: Implementar `src/lib/money.ts`**

```ts
export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
```

- [ ] **Step 4:** Run: `npx jest src/lib/money.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/money.ts src/lib/money.test.ts
git commit -m "feat(driver): helper brl compartilhado"
```

---

### Task 5: Botão

**Files:**
- Modify: `src/ui/Button.tsx`
- Create: `src/ui/Button.test.tsx`

- [ ] **Step 1: Teste**

```tsx
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button } from "./Button";
import { ThemeRoot } from "./ThemeRoot";

function renderButton(props: Partial<React.ComponentProps<typeof Button>> = {}) {
  const onPress = jest.fn();
  render(
    <ThemeRoot scheme="light">
      <Button label="Aceitar" onPress={onPress} {...props} />
    </ThemeRoot>
  );
  return onPress;
}

describe("Button", () => {
  it("chama onPress ao tocar", () => {
    const onPress = renderButton();
    fireEvent.press(screen.getByRole("button", { name: "Aceitar" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("não chama onPress enquanto carrega", () => {
    const onPress = renderButton({ loading: true });
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("não chama onPress quando desabilitado", () => {
    const onPress = renderButton({ disabled: true });
    fireEvent.press(screen.getByRole("button", { name: "Aceitar" }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2:** Run: `npx jest src/ui/Button.test.tsx` → deve PASSAR já com o Button atual (rede de segurança antes de refatorar). Se falhar por causa do `ThemeRoot`/nativewind no Jest, parar e investigar antes de seguir.

- [ ] **Step 3: Reescrever `src/ui/Button.tsx`** (mesma API de props; mudam alturas, raio, fonte e cores via token)

```tsx
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
```

- [ ] **Step 4:** Run: `npx jest src/ui/Button.test.tsx` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/Button.tsx src/ui/Button.test.tsx
git commit -m "feat(driver): botao maior e tokens de tema"
```

---

### Task 6: Input, EmptyState e LoadingSpinner

**Files:**
- Modify: `src/ui/Input.tsx`, `src/ui/EmptyState.tsx`, `src/ui/LoadingSpinner.tsx`

- [ ] **Step 1: `LoadingSpinner.tsx`**

```tsx
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
```

- [ ] **Step 2: `Input.tsx`** — trocar os três `#6B7280` por `p.mutedForeground`, o rótulo e o campo:

No topo do componente (antes de `useState`): `const p = usePalette();` e `import { usePalette } from "./theme";`.
Defaults: `rounded = "rounded-2xl"`, `height = "h-14"`.
Rótulo: `className="text-sm font-medium text-muted-foreground"` (sai o uppercase e o `text-xs`).
Campo: `className={\`${height} ${rounded} border-2 bg-card px-4 text-[17px] text-foreground ${isPassword ? "pr-12" : ""} ${error ? "border-destructive" : "border-border"} ${className ?? ""}\`}`.
`placeholderTextColor={p.mutedForeground}`; ícones `EyeOff`/`Eye` com `color={p.mutedForeground}` e botão do olho com `hitSlop={12}` e `className="absolute right-2 h-11 w-11 items-center justify-center"`.
Mensagem de erro: `className="text-sm text-destructive"`.

- [ ] **Step 3: `EmptyState.tsx`** — título `className="text-center font-poppins-semibold text-xl text-foreground"` e descrição `className="text-center text-base text-muted-foreground"`.

- [ ] **Step 4: Typecheck e testes das telas que usam Input**

Run: `npx tsc --noEmit` → sem erros.
Run (um por chamada): `npx jest "app/(auth)/login.test.tsx"` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/Input.tsx src/ui/EmptyState.tsx src/ui/LoadingSpinner.tsx
git commit -m "feat(driver): input, empty state e spinner com tokens e tamanhos novos"
```

---

### Task 7: Avatar e lista agrupada

**Files:**
- Create: `src/ui/Avatar.tsx`, `src/ui/Avatar.test.tsx`, `src/ui/ListGroup.tsx`, `src/ui/ListGroup.test.tsx`

- [ ] **Step 1: Testes**

`src/ui/Avatar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native";
import { Avatar, initialsOf } from "./Avatar";

describe("initialsOf", () => {
  it("usa primeira e última palavra", () => {
    expect(initialsOf("Marcos Vinícius Sousa")).toBe("MS");
  });
  it("usa uma letra quando há uma palavra só", () => {
    expect(initialsOf("marcos")).toBe("M");
  });
  it("ignora espaços sobrando e devolve ? sem nome", () => {
    expect(initialsOf("  ana   paula ")).toBe("AP");
    expect(initialsOf("   ")).toBe("?");
  });
});

describe("Avatar", () => {
  it("mostra as iniciais", () => {
    render(<Avatar name="Marcos Sousa" />);
    expect(screen.getByText("MS")).toBeTruthy();
  });
});
```

`src/ui/ListGroup.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Headphones } from "lucide-react-native";
import { ListGroup, ListRow } from "./ListGroup";

describe("ListRow", () => {
  it("mostra o rótulo e chama onPress", () => {
    const onPress = jest.fn();
    render(
      <ListGroup>
        <ListRow icon={Headphones} label="Ajuda e suporte" onPress={onPress} />
      </ListGroup>
    );
    fireEvent.press(screen.getByRole("button", { name: "Ajuda e suporte" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2:** Run `npx jest src/ui/Avatar.test.tsx` → FAIL; run `npx jest src/ui/ListGroup.test.tsx` → FAIL (um por chamada).

- [ ] **Step 3: `src/ui/Avatar.tsx`**

```tsx
import { Text, View } from "react-native";

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="items-center justify-center rounded-full bg-primary"
      style={{ width: size, height: size }}
    >
      <Text
        className="font-poppins-bold text-primary-foreground"
        style={{ fontSize: Math.round(size * 0.36) }}
      >
        {initialsOf(name)}
      </Text>
    </View>
  );
}
```

- [ ] **Step 4: `src/ui/ListGroup.tsx`**

```tsx
import type { ComponentType, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { usePalette } from "./theme";

type IconComponent = ComponentType<{ size?: number; color?: string }>;

export function ListGroup({ children }: { children: ReactNode }) {
  return (
    <View className="overflow-hidden rounded-3xl border border-border bg-card">
      {children}
    </View>
  );
}

export function ListRow({
  icon: Icon,
  label,
  onPress,
  chevron = true,
  last = false,
}: {
  icon: IconComponent;
  label: string;
  onPress: () => void;
  chevron?: boolean;
  last?: boolean;
}) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`min-h-14 flex-row items-center gap-3 px-4 py-3 active:opacity-70 ${
        last ? "" : "border-b border-border"
      }`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-muted">
        <Icon size={20} color={p.foreground} />
      </View>
      <Text className="flex-1 text-base font-medium text-foreground">{label}</Text>
      {chevron ? <ChevronRight size={20} color={p.mutedForeground} /> : null}
    </Pressable>
  );
}
```

- [ ] **Step 5:** Run `npx jest src/ui/Avatar.test.tsx` → PASS; `npx jest src/ui/ListGroup.test.tsx` → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/Avatar.tsx src/ui/Avatar.test.tsx src/ui/ListGroup.tsx src/ui/ListGroup.test.tsx
git commit -m "feat(driver): avatar e lista agrupada"
```

---

### Task 8: Oferta (anel, rota e folha)

**Files:**
- Modify: `src/@types/driver.ts` (interface `DeliveryOffer`)
- Create: `src/ui/CountdownRing.tsx`, `src/ui/RouteLegs.tsx`, `src/ui/OfferSheet.tsx` e um `.test.tsx` para cada

- [ ] **Step 1: Campos opcionais no tipo**

Em `DeliveryOffer` (após `dt_expires_at: string;`) acrescentar:

```ts
  /** Preenchidos pelo back em GET /deliveries/offers; ausentes em versões antigas. */
  pickup_name?: string | null;
  pickup_district?: string | null;
  dropoff_district?: string | null;
```

- [ ] **Step 2: Testes**

`src/ui/CountdownRing.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native";
import { CountdownRing, ringOffset } from "./CountdownRing";

describe("ringOffset", () => {
  it("é 0 com o tempo cheio e a circunferência com o tempo zerado", () => {
    expect(ringOffset(30, 30, 100)).toBe(0);
    expect(ringOffset(0, 30, 100)).toBe(100);
  });
  it("é proporcional no meio e não passa dos limites", () => {
    expect(ringOffset(15, 30, 100)).toBe(50);
    expect(ringOffset(99, 30, 100)).toBe(0);
    expect(ringOffset(-5, 30, 100)).toBe(100);
  });
  it("trata total inválido como anel vazio", () => {
    expect(ringOffset(10, 0, 100)).toBe(100);
  });
});

describe("CountdownRing", () => {
  it("anuncia os segundos restantes", () => {
    render(<CountdownRing remaining={18} total={30} />);
    expect(screen.getByLabelText("18 segundos para aceitar")).toBeTruthy();
  });
});
```

`src/ui/RouteLegs.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native";
import { RouteLegs } from "./RouteLegs";

describe("RouteLegs", () => {
  it("não renderiza nada sem dados", () => {
    const { toJSON } = render(<RouteLegs />);
    expect(toJSON()).toBeNull();
  });

  it("mostra restaurante e bairros", () => {
    render(
      <RouteLegs
        pickupName="Cantinho da Dona Rosa"
        pickupDistrict="Centro"
        dropoffDistrict="Vila Nova"
      />
    );
    expect(screen.getByText("Cantinho da Dona Rosa")).toBeTruthy();
    expect(screen.getByText("Retirada · Centro")).toBeTruthy();
    expect(screen.getByText("Vila Nova")).toBeTruthy();
    expect(screen.getByText("Entrega")).toBeTruthy();
  });

  it("mostra só a retirada quando falta o bairro de entrega", () => {
    render(<RouteLegs pickupName="Brasa Burguer" />);
    expect(screen.getByText("Brasa Burguer")).toBeTruthy();
    expect(screen.getByText("Retirada")).toBeTruthy();
    expect(screen.queryByText("Entrega")).toBeNull();
  });
});
```

`src/ui/OfferSheet.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react-native";
import { OfferSheet, offerLifetimeSeconds } from "./OfferSheet";
import type { DeliveryOffer } from "../@types/driver";

const NOW = Date.now();
const offer: DeliveryOffer = {
  id_delivery_offer: "o1",
  id_order: "p1",
  id_establishment: "e1",
  id_driver: "d1",
  enum_status: "OFFERED",
  int_payout_cents: 850,
  dt_offered_at: new Date(NOW - 12_000).toISOString(),
  dt_expires_at: new Date(NOW + 18_000).toISOString(),
  pickup_name: "Cantinho da Dona Rosa",
  pickup_district: "Centro",
  dropoff_district: "Vila Nova",
};

describe("offerLifetimeSeconds", () => {
  it("é a diferença entre oferta e expiração, com mínimo de 1", () => {
    expect(offerLifetimeSeconds(offer)).toBe(30);
    expect(
      offerLifetimeSeconds({ dt_offered_at: offer.dt_expires_at, dt_expires_at: offer.dt_expires_at })
    ).toBe(1);
  });
});

describe("OfferSheet", () => {
  it("mostra valor, restaurante e a fila", () => {
    render(<OfferSheet offer={offer} queued={2} onAccept={jest.fn()} onDecline={jest.fn()} />);
    expect(screen.getByText(/R\$\s8,50/)).toBeTruthy();
    expect(screen.getByText("Cantinho da Dona Rosa")).toBeTruthy();
    expect(screen.getByText(/mais 2 na fila/)).toBeTruthy();
  });

  it("chama aceitar e recusar", () => {
    const onAccept = jest.fn();
    const onDecline = jest.fn();
    render(<OfferSheet offer={offer} queued={0} onAccept={onAccept} onDecline={onDecline} />);
    fireEvent.press(screen.getByRole("button", { name: "Aceitar corrida" }));
    fireEvent.press(screen.getByRole("button", { name: "Recusar" }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it("funciona sem os campos novos do back", () => {
    const { pickup_name, pickup_district, dropoff_district, ...legacy } = offer;
    render(<OfferSheet offer={legacy} queued={0} onAccept={jest.fn()} onDecline={jest.fn()} />);
    expect(screen.getByText(/R\$\s8,50/)).toBeTruthy();
    expect(screen.queryByText("Cantinho da Dona Rosa")).toBeNull();
  });
});
```

- [ ] **Step 3:** Rodar cada teste (um por chamada) e ver falhar: `npx jest src/ui/CountdownRing.test.tsx`, `npx jest src/ui/RouteLegs.test.tsx`, `npx jest src/ui/OfferSheet.test.tsx`.

- [ ] **Step 4: `src/ui/CountdownRing.tsx`**

```tsx
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { usePalette } from "./theme";

const STROKE = 6;

/** Deslocamento do traço: 0 = anel cheio, circunferência = anel vazio. */
export function ringOffset(remaining: number, total: number, circumference: number): number {
  if (total <= 0) return circumference;
  const ratio = Math.min(1, Math.max(0, remaining / total));
  return circumference * (1 - ratio);
}

export function CountdownRing({
  remaining,
  total,
  size = 76,
}: {
  remaining: number;
  total: number;
  size?: number;
}) {
  const p = usePalette();
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`${remaining} segundos para aceitar`}
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={p.muted} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={p.primary}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={ringOffset(remaining, total, circumference)}
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="font-poppins-extrabold text-2xl leading-7 text-foreground">{remaining}</Text>
        <Text className="text-xs text-muted-foreground">seg</Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 5: `src/ui/RouteLegs.tsx`**

```tsx
import type { ComponentType } from "react";
import { Text, View } from "react-native";
import { MapPin, Store } from "lucide-react-native";
import { usePalette } from "./theme";

type IconComponent = ComponentType<{ size?: number; color?: string }>;

function Leg({ icon: Icon, title, subtitle }: { icon: IconComponent; title: string; subtitle: string }) {
  const p = usePalette();
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
        <Icon size={20} color={p.primaryText} />
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-base font-semibold text-foreground">
          {title}
        </Text>
        <Text numberOfLines={1} className="text-sm text-muted-foreground">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export function RouteLegs({
  pickupName,
  pickupDistrict,
  dropoffDistrict,
}: {
  pickupName?: string | null;
  pickupDistrict?: string | null;
  dropoffDistrict?: string | null;
}) {
  if (!pickupName && !dropoffDistrict) return null;

  return (
    <View className="gap-3 rounded-2xl border border-border bg-background p-3.5">
      {pickupName ? (
        <Leg
          icon={Store}
          title={pickupName}
          subtitle={pickupDistrict ? `Retirada · ${pickupDistrict}` : "Retirada"}
        />
      ) : null}
      {dropoffDistrict ? <Leg icon={MapPin} title={dropoffDistrict} subtitle="Entrega" /> : null}
    </View>
  );
}
```

- [ ] **Step 6: `src/ui/OfferSheet.tsx`**

```tsx
import { Text, View } from "react-native";
import { Button } from "./Button";
import { CountdownRing } from "./CountdownRing";
import { RouteLegs } from "./RouteLegs";
import { brl } from "../lib/money";
import { secondsUntil } from "../driver/useOffers";
import type { DeliveryOffer } from "../@types/driver";

/** Tempo total que a oferta ficou aberta, em segundos (mínimo 1). */
export function offerLifetimeSeconds(
  offer: Pick<DeliveryOffer, "dt_offered_at" | "dt_expires_at">
): number {
  const ms = new Date(offer.dt_expires_at).getTime() - new Date(offer.dt_offered_at).getTime();
  return Math.max(1, Math.round(ms / 1000));
}

export function OfferSheet({
  offer,
  queued,
  onAccept,
  onDecline,
}: {
  offer: DeliveryOffer;
  /** Quantas outras ofertas esperam depois desta. */
  queued: number;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const remaining = secondsUntil(offer.dt_expires_at);

  return (
    <View className="absolute inset-0 justify-end">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="absolute inset-0 bg-black/55"
      />
      <View accessibilityViewIsModal className="gap-5 rounded-t-[30px] bg-card px-5 pb-8 pt-3">
        <View className="h-1.5 w-10 self-center rounded-full bg-border" />
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-muted-foreground">
              {queued > 0 ? `Nova corrida · mais ${queued} na fila` : "Nova corrida"}
            </Text>
            <Text className="font-poppins-extrabold text-[44px] leading-[52px] text-foreground">
              {brl(offer.int_payout_cents)}
            </Text>
            <Text className="text-sm text-muted-foreground">você recebe nesta entrega</Text>
          </View>
          <CountdownRing remaining={remaining} total={offerLifetimeSeconds(offer)} />
        </View>
        <RouteLegs
          pickupName={offer.pickup_name}
          pickupDistrict={offer.pickup_district}
          dropoffDistrict={offer.dropoff_district}
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button label="Recusar" variant="outline" height="h-16" onPress={onDecline} />
          </View>
          <View className="flex-[2]">
            <Button label="Aceitar corrida" height="h-16" onPress={onAccept} />
          </View>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 7:** Rodar de novo, um por chamada: `CountdownRing.test.tsx`, `RouteLegs.test.tsx`, `OfferSheet.test.tsx` → PASS.

- [ ] **Step 8: Commit**

```bash
git add src/@types/driver.ts src/ui/CountdownRing.tsx src/ui/CountdownRing.test.tsx src/ui/RouteLegs.tsx src/ui/RouteLegs.test.tsx src/ui/OfferSheet.tsx src/ui/OfferSheet.test.tsx
git commit -m "feat(driver): folha de oferta com anel de contagem e rota"
```

---

### Task 9: Bloco de estado e tela Início

**Files:**
- Create: `src/ui/StateCard.tsx`, `src/ui/StateCard.test.tsx`
- Modify: `app/(tabs)/home.tsx` (só imports e o `return` final; **não** tocar nos hooks, efeitos, `toggleOnline` nem nos `showError` de aceitar/recusar)

- [ ] **Step 1: Teste `src/ui/StateCard.test.tsx`**

```tsx
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StateCard } from "./StateCard";

describe("StateCard", () => {
  it("offline: oferece ficar online", () => {
    const onToggle = jest.fn();
    render(<StateCard online={false} busy={false} onToggle={onToggle} />);
    expect(screen.getByText("Você está offline")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Ficar online" }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("online: mostra a busca e oferece ficar offline", () => {
    const onToggle = jest.fn();
    render(<StateCard online busy={false} onToggle={onToggle} />);
    expect(screen.getByText("Procurando corridas perto de você")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Ficar offline" }));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("não dispara enquanto troca de estado", () => {
    const onToggle = jest.fn();
    render(<StateCard online busy onToggle={onToggle} />);
    fireEvent.press(screen.getByRole("button", { name: "Ficar offline" }));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2:** Run `npx jest src/ui/StateCard.test.tsx` → FAIL.

- [ ] **Step 3: `src/ui/StateCard.tsx`**

```tsx
import { Pressable, Text, View } from "react-native";
import { Power } from "lucide-react-native";
import { Button } from "./Button";
import { palette, usePalette } from "./theme";

export function StateCard({
  online,
  busy,
  onToggle,
}: {
  online: boolean;
  busy: boolean;
  onToggle: (next: boolean) => void;
}) {
  const p = usePalette();

  return (
    <View className="gap-3 rounded-[28px] border border-deck-border bg-deck p-5">
      <View className="flex-row items-center gap-2 self-start rounded-full bg-deck-foreground/10 px-3 py-1.5">
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: online ? palette.dark.money : p.deckMuted,
          }}
        />
        <Text className="text-sm font-semibold text-deck-foreground">
          {online ? "Online" : "Offline"}
        </Text>
      </View>

      <Text className="font-poppins-bold text-2xl leading-8 text-deck-foreground">
        {online ? "Procurando corridas perto de você" : "Você está offline"}
      </Text>
      <Text className="text-base leading-6 text-deck-muted">
        {online
          ? "Deixe o app aberto. A corrida aparece aqui assim que chegar."
          : "Fique online para começar a receber corridas."}
      </Text>

      {online ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ficar offline"
          accessibilityState={{ disabled: busy, busy }}
          disabled={busy}
          onPress={() => onToggle(false)}
          className={`mt-2 h-14 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-deck-foreground/35 active:opacity-70 ${
            busy ? "opacity-50" : ""
          }`}
        >
          <Power size={22} color={p.deckForeground} />
          <Text className="font-poppins-semibold text-[17px] text-deck-foreground">Ficar offline</Text>
        </Pressable>
      ) : (
        <View className="mt-2">
          <Button label="Ficar online" icon={Power} loading={busy} onPress={() => onToggle(true)} />
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 4:** Run `npx jest src/ui/StateCard.test.tsx` → PASS.

- [ ] **Step 5: Reescrever o fim de `app/(tabs)/home.tsx`**

5a. Imports: remover `FlatList`, `Switch` (react-native), `Button`, `EmptyState` e a função local `brl` + o componente `OfferCard` (linhas 24–54 do original). Acrescentar:

```tsx
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { StateCard } from "../../src/ui/StateCard";
import { OfferSheet } from "../../src/ui/OfferSheet";
import { Avatar } from "../../src/ui/Avatar";
import { usePalette } from "../../src/ui/theme";
import { getBalance } from "../../src/api/wallet";
import { brl } from "../../src/lib/money";
```
(`secondsUntil` deixa de ser usado na tela; manter só `useOffers` no import de `../../src/driver/useOffers`.)

5b. Junto dos outros hooks, **antes** de `if (activeQuery.isLoading)`:

```tsx
  const p = usePalette();
  const { data: balance } = useQuery({ queryKey: ["driver-balance"], queryFn: getBalance });
```

5c. Trocar tudo de `return (\n    <Screen>` até o fim do componente por:

```tsx
  const [firstOffer, ...queuedOffers] = offers;
  const firstName = driver?.tx_full_name.split(" ")[0] ?? "";

  return (
    <View className="flex-1">
      <Screen>
        <View className="mt-4 flex-1 gap-4">
          <View className="flex-row items-center gap-3">
            <Avatar name={driver?.tx_full_name ?? ""} />
            <View className="flex-1">
              <Text className="font-poppins-bold text-xl text-foreground">Olá, {firstName}</Text>
              <Text className="text-sm text-muted-foreground">
                {driver?.tx_city}
                {driver?.tx_vehicle_type ? ` · ${driver.tx_vehicle_type}` : ""}
              </Text>
            </View>
          </View>

          <StateCard
            online={online}
            busy={togglingOnline}
            onToggle={(value) => void toggleOnline(value)}
          />

          {online && isLoading ? <LoadingSpinner /> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir carteira"
            onPress={() => router.push("/wallet")}
            className="flex-row items-center justify-between rounded-3xl border border-border bg-card py-4 pl-5 pr-4 active:opacity-70"
          >
            <View>
              <Text className="text-sm font-semibold text-muted-foreground">Disponível para saque</Text>
              <Text className="font-poppins-bold text-2xl text-foreground">
                {balance ? brl(balance.available_cents) : "—"}
              </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
              <ChevronRight size={22} color={p.foreground} />
            </View>
          </Pressable>
        </View>
      </Screen>

      {online && firstOffer ? (
        <OfferSheet
          offer={firstOffer}
          queued={queuedOffers.length}
          onAccept={() =>
            void accept(firstOffer.id_delivery_offer).catch((err) =>
              showError(err, "Essa oferta não está mais disponível.")
            )
          }
          onDecline={() =>
            void decline(firstOffer.id_delivery_offer).catch((err) =>
              showError(err, "Não foi possível recusar a oferta.")
            )
          }
        />
      ) : null}
    </View>
  );
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit` → sem erros. Conferir com `git diff app/(tabs)/home.tsx` que `toggleOnline`, `activeQuery`, `useLocationTracking` e `onlineInitializedRef` não mudaram.

- [ ] **Step 7: Commit**

```bash
git add src/ui/StateCard.tsx src/ui/StateCard.test.tsx "app/(tabs)/home.tsx"
git commit -m "feat(driver): tela inicio com bloco de estado e folha de oferta"
```

---

### Task 10: Back — restaurante e bairros na oferta

**Files (repo `fominha-back`):**
- Create: `src/delivery/infra/http/offer-view.ts`, `src/delivery/infra/http/offer-view.spec.ts`
- Modify: `src/delivery/infra/http/delivery.controller.ts` (método `listOffers`)

- [ ] **Step 1: Teste `offer-view.spec.ts`**

```ts
import { toOfferView } from './offer-view';

describe('toOfferView', () => {
  const offer = { id_delivery_offer: 'o1', id_order: 'p1', int_payout_cents: 850 };

  it('acrescenta restaurante e bairros do pedido', () => {
    const view = toOfferView(offer, {
      establishment: {
        tx_name: 'Cantinho da Dona Rosa',
        address: { tx_district: 'Centro' },
      },
      address: { tx_district: 'Vila Nova' },
    });
    expect(view).toEqual({
      ...offer,
      pickup_name: 'Cantinho da Dona Rosa',
      pickup_district: 'Centro',
      dropoff_district: 'Vila Nova',
    });
  });

  it('devolve nulos quando o pedido não é encontrado', () => {
    expect(toOfferView(offer, undefined)).toEqual({
      ...offer,
      pickup_name: null,
      pickup_district: null,
      dropoff_district: null,
    });
  });

  it('devolve nulos quando faltam endereços', () => {
    const view = toOfferView(offer, {
      establishment: { tx_name: 'Brasa Burguer', address: null },
      address: null,
    });
    expect(view.pickup_name).toBe('Brasa Burguer');
    expect(view.pickup_district).toBeNull();
    expect(view.dropoff_district).toBeNull();
  });
});
```

- [ ] **Step 2:** `cd ../fominha-back && npx jest src/delivery/infra/http/offer-view.spec.ts` → FAIL (módulo não existe).

- [ ] **Step 3: `offer-view.ts`**

```ts
export interface OfferOrderInfo {
  establishment: {
    tx_name: string;
    address: { tx_district: string | null } | null;
  };
  address: { tx_district: string | null } | null;
}

/** Oferta como o app do entregador a recebe: linha crua + dados para decidir. */
export function toOfferView<T extends { id_order: string }>(
  offer: T,
  order: OfferOrderInfo | undefined,
) {
  return {
    ...offer,
    pickup_name: order?.establishment.tx_name ?? null,
    pickup_district: order?.establishment.address?.tx_district ?? null,
    dropoff_district: order?.address?.tx_district ?? null,
  };
}
```

- [ ] **Step 4:** `npx jest src/delivery/infra/http/offer-view.spec.ts` → PASS.

- [ ] **Step 5: `listOffers` no controller**

Importar `toOfferView` e trocar o corpo do método por:

```ts
  @Get('offers')
  async listOffers(@Req() req: DriverRequest) {
    const offers = await this.prisma.deliveryOffer.findMany({
      where: {
        id_driver: req.driverId,
        enum_status: 'OFFERED',
        dt_expires_at: { gt: new Date() },
      },
      orderBy: { dt_offered_at: 'asc' },
    });
    if (offers.length === 0) return offers;

    const orders = await this.prisma.order.findMany({
      where: { id_order: { in: offers.map((o) => o.id_order) } },
      select: {
        id_order: true,
        establishment: {
          select: { tx_name: true, address: { select: { tx_district: true } } },
        },
        address: { select: { tx_district: true } },
      },
    });
    const byId = new Map(orders.map((o) => [o.id_order, o]));
    return offers.map((offer) => toOfferView(offer, byId.get(offer.id_order)));
  }
```

- [ ] **Step 6: Typecheck e commit**

Run: `npx tsc --noEmit -p tsconfig.json` → sem erros novos.

```bash
git add src/delivery/infra/http/offer-view.ts src/delivery/infra/http/offer-view.spec.ts src/delivery/infra/http/delivery.controller.ts
git commit -m "feat(entregas): restaurante e bairros na oferta do entregador"
```

---

### Task 11: Entrega ativa

**Files:**
- Create: `src/ui/StepTracker.tsx`, `src/ui/StepTracker.test.tsx`
- Modify: `app/delivery/active.tsx` (só imports, a linha `usePalette`, e o JSX a partir de `const destination =`; **não** tocar nos efeitos, `handlePickup`, `handleStart`, `handleConfirmCode`)

- [ ] **Step 1: Teste**

```tsx
import { render, screen } from "@testing-library/react-native";
import { StepTracker, currentStep } from "./StepTracker";

describe("currentStep", () => {
  it("mapeia o status do pedido para o passo", () => {
    expect(currentStep("READY_FOR_PICKUP")).toBe(1);
    expect(currentStep("PICKED_UP")).toBe(2);
    expect(currentStep("DELIVERY")).toBe(3);
  });
});

describe("StepTracker", () => {
  it("anuncia o passo atual", () => {
    render(<StepTracker status="PICKED_UP" />);
    expect(screen.getByLabelText("Passo 2 de 3: Levar")).toBeTruthy();
  });
});
```

- [ ] **Step 2:** `npx jest src/ui/StepTracker.test.tsx` → FAIL.

- [ ] **Step 3: `src/ui/StepTracker.tsx`**

```tsx
import { Text, View } from "react-native";
import type { OrderStatus } from "../@types/driver";

const STEPS = ["Retirar", "Levar", "Entregar"] as const;

export function currentStep(status: OrderStatus): 1 | 2 | 3 {
  if (status === "PICKED_UP") return 2;
  if (status === "DELIVERY") return 3;
  return 1;
}

export function StepTracker({ status }: { status: OrderStatus }) {
  const step = currentStep(status);

  return (
    <View
      accessible
      accessibilityLabel={`Passo ${step} de 3: ${STEPS[step - 1]}`}
      className="flex-row items-center gap-2"
    >
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <View key={label} className="flex-1 flex-row items-center gap-2">
            <View
              className={`h-7 w-7 items-center justify-center rounded-full ${
                active || done ? "bg-primary" : "bg-muted"
              }`}
            >
              <Text className={`text-xs font-bold ${active || done ? "text-primary-foreground" : "text-muted-foreground"}`}>
                {done ? "✓" : n}
              </Text>
            </View>
            <Text className={`text-sm ${active ? "font-bold text-foreground" : "text-muted-foreground"}`}>
              {label}
            </Text>
            {n < 3 ? <View className="h-0.5 flex-1 rounded-full bg-border" /> : null}
          </View>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4:** `npx jest src/ui/StepTracker.test.tsx` → PASS.

- [ ] **Step 5: Imports e hook em `app/delivery/active.tsx`**

Trocar `import { Modal, Text, View } from "react-native";` por `import { Modal, Pressable, Text, View } from "react-native";` e acrescentar:

```tsx
import { Navigation } from "lucide-react-native";
import { StepTracker } from "../../src/ui/StepTracker";
import { ThemeRoot } from "../../src/ui/ThemeRoot";
import { usePalette } from "../../src/ui/theme";
import { brl } from "../../src/lib/money";
```
Remover a função local `brl` (linhas 24–26 do original). Logo após `const queryClient = useQueryClient();` acrescentar `const p = usePalette();`.

- [ ] **Step 6: Trocar o JSX**

Manter as linhas `const destination = …` e `const destinationLabel = …` e substituir **tudo depois delas** por:

```tsx
  const recipient = "name" in destination ? destination.name : activeDelivery.tx_customer_name;
  const status = activeDelivery.enum_status;

  return (
    <Screen>
      <KeyboardAwareScroll
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 pb-6 pt-2"
      >
        {destinationCoords ? (
          <View className="h-72 overflow-hidden rounded-3xl">
            <MapView
              key={`${destinationCoords.latitude},${destinationCoords.longitude}`}
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: destinationCoords.latitude,
                longitude: destinationCoords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              {route ? <Polyline coordinates={route.points} strokeColor={p.primary} strokeWidth={5} /> : null}
              <Marker coordinate={destinationCoords} title={destinationLabel} pinColor={p.primary} />
              {driverCoords ? <Marker coordinate={driverCoords} title="Você" pinColor={p.foreground} /> : null}
            </MapView>
            {route ? (
              <View className="absolute bottom-3 left-3 h-10 flex-row items-center rounded-full bg-card px-3.5">
                <Text className="text-sm text-foreground">
                  <Text className="font-bold">{route.durationText}</Text> · {route.distanceText}
                </Text>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Navegar"
              onPress={() =>
                void openNavigation(destinationCoords).catch(() =>
                  setError("Não foi possível abrir o app de navegação.")
                )
              }
              className="absolute bottom-3 right-3 h-12 flex-row items-center gap-2 rounded-full bg-deck px-4 active:opacity-80"
            >
              <Navigation size={18} color={p.primary} />
              <Text className="text-[15px] font-semibold text-deck-foreground">Navegar</Text>
            </Pressable>
          </View>
        ) : null}

        <StepTracker status={status} />

        <View className="gap-1">
          <Text className="text-sm font-semibold text-muted-foreground">{destinationLabel}</Text>
          <Text className="font-poppins-bold text-[22px] leading-7 text-foreground">{recipient}</Text>
          <Text className="text-base text-muted-foreground">{formatAddress(destination)}</Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 gap-0.5 rounded-2xl border border-border bg-card p-3.5">
            <Text className="text-sm font-semibold text-muted-foreground">Cliente</Text>
            <Text className="font-poppins-semibold text-[17px] text-foreground">
              {activeDelivery.tx_customer_name}
            </Text>
            {activeDelivery.tx_customer_phone ? (
              <Text className="text-sm text-muted-foreground">{activeDelivery.tx_customer_phone}</Text>
            ) : null}
          </View>
          <View className="flex-1 gap-0.5 rounded-2xl border border-border bg-card p-3.5">
            <Text className="text-sm font-semibold text-muted-foreground">Você recebe</Text>
            <Text className="font-poppins-bold text-[17px] text-money">
              {brl(activeDelivery.int_delivery_fee_cents)}
            </Text>
            <Text className="text-sm text-muted-foreground">
              pedido de {brl(activeDelivery.int_total_cents)}
            </Text>
          </View>
        </View>

        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      </KeyboardAwareScroll>

      <View className="border-t border-border pb-2 pt-3">
        {status === "READY_FOR_PICKUP" ? (
          <Button label="Retirei o pedido" loading={busy} onPress={() => void handlePickup()} />
        ) : null}
        {status === "PICKED_UP" ? (
          <Button label="Iniciar entrega" loading={busy} onPress={() => void handleStart()} />
        ) : null}
        {status === "DELIVERY" ? (
          <Button label="Confirmar entrega" onPress={() => setCodeModalOpen(true)} />
        ) : null}
      </View>

      <Modal visible={codeModalOpen} transparent animationType="slide">
        <ThemeRoot>
          <View className="flex-1 items-center justify-center bg-black/55 px-4">
            <View className="w-full gap-4 rounded-3xl bg-background p-6">
              <Text className="font-poppins-bold text-xl text-foreground">
                Peça o código de confirmação ao cliente
              </Text>
              <Input
                label="Código"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoFocus
              />
              {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    label="Cancelar"
                    variant="outline"
                    onPress={() => {
                      setCodeModalOpen(false);
                      setError(null);
                    }}
                  />
                </View>
                <View className="flex-[1.4]">
                  <Button label="Confirmar" loading={busy} onPress={() => void handleConfirmCode()} />
                </View>
              </View>
            </View>
          </View>
        </ThemeRoot>
      </Modal>
    </Screen>
  );
}
```

- [ ] **Step 7: Typecheck** → `npx tsc --noEmit` sem erros. Conferir no `git diff` que os handlers e efeitos não mudaram. Se `KeyboardAwareScroll` não ocupar o espaço restante (rodapé empurrado), passar `style={{ flex: 1 }}` a ele.

- [ ] **Step 8: Commit**

```bash
git add src/ui/StepTracker.tsx src/ui/StepTracker.test.tsx app/delivery/active.tsx
git commit -m "feat(driver): entrega ativa com passos, mapa e botao fixo"
```

---

### Task 12: Carteira

**Files:**
- Create: `src/ui/LedgerRow.tsx`, `src/ui/LedgerRow.test.tsx`, `src/ui/BalanceCard.tsx`, `src/ui/BalanceCard.test.tsx`
- Modify: `app/(tabs)/wallet.tsx` (só imports e o `return`; `MIN_WITHDRAWAL_CENTS`, estados, `handleWithdraw` ficam)

- [ ] **Step 1: Testes**

`src/ui/LedgerRow.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native";
import { LedgerRow, formatSigned } from "./LedgerRow";

describe("formatSigned", () => {
  it("usa + para entrada e − para saída", () => {
    expect(formatSigned(850).replace(/ /g, " ")).toBe("+ R$ 8,50");
    expect(formatSigned(-12000).replace(/ /g, " ")).toBe("− R$ 120,00");
  });
});

describe("LedgerRow", () => {
  it("traduz o tipo do lançamento", () => {
    render(
      <LedgerRow
        entry={{
          id: "1",
          type: "DRIVER_EARNING",
          amount_cents: 850,
          status: "AVAILABLE",
          order_id: null,
          occurred_at: "2026-10-28T12:00:00.000Z",
        }}
      />
    );
    expect(screen.getByText("Ganho de entrega")).toBeTruthy();
  });
});
```

`src/ui/BalanceCard.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react-native";
import { BalanceCard } from "./BalanceCard";

const base = {
  availableCents: 18640,
  pendingCents: 2400,
  inReviewCents: 0,
  amount: "",
  onAmountChange: jest.fn(),
  onSubmit: jest.fn(),
  submitting: false,
  error: null,
};

describe("BalanceCard", () => {
  it("mostra saldo, pendente e em análise", () => {
    render(<BalanceCard {...base} />);
    expect(screen.getByText(/R\$\s186,40/)).toBeTruthy();
    expect(screen.getByText(/R\$\s24,00/)).toBeTruthy();
  });

  it("repassa o valor digitado e o toque em Sacar", () => {
    const onAmountChange = jest.fn();
    const onSubmit = jest.fn();
    render(<BalanceCard {...base} onAmountChange={onAmountChange} onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByLabelText("Valor do saque"), "50");
    expect(onAmountChange).toHaveBeenCalledWith("50");
    fireEvent.press(screen.getByRole("button", { name: "Sacar" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("mostra o erro", () => {
    render(<BalanceCard {...base} error="Informe um valor válido." />);
    expect(screen.getByText("Informe um valor válido.")).toBeTruthy();
  });
});
```

- [ ] **Step 2:** Rodar `npx jest src/ui/LedgerRow.test.tsx` e `npx jest src/ui/BalanceCard.test.tsx` (um por chamada) → FAIL.

- [ ] **Step 3: `src/ui/LedgerRow.tsx`**

```tsx
import { Text, View } from "react-native";
import { brl } from "../lib/money";
import type { DriverBalance } from "../@types/driver";

export const ENTRY_LABEL: Record<string, string> = {
  DRIVER_EARNING: "Ganho de entrega",
  WITHDRAWAL: "Saque",
};

export function formatSigned(cents: number): string {
  return `${cents < 0 ? "−" : "+"} ${brl(Math.abs(cents))}`;
}

export function LedgerRow({ entry }: { entry: DriverBalance["recent_entries"][number] }) {
  return (
    <View className="min-h-16 flex-row items-center justify-between gap-3 border-b border-border py-3">
      <View className="flex-1">
        <Text className="text-base font-medium text-foreground">
          {ENTRY_LABEL[entry.type] ?? entry.type}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {new Date(entry.occurred_at).toLocaleDateString("pt-BR")}
        </Text>
      </View>
      <Text
        className={`font-poppins-bold text-base ${
          entry.amount_cents < 0 ? "text-foreground" : "text-money"
        }`}
      >
        {formatSigned(entry.amount_cents)}
      </Text>
    </View>
  );
}
```

- [ ] **Step 4: `src/ui/BalanceCard.tsx`**

```tsx
import { Text, TextInput, View } from "react-native";
import { Button } from "./Button";
import { usePalette } from "./theme";
import { brl } from "../lib/money";

export function BalanceCard({
  availableCents,
  pendingCents,
  inReviewCents,
  amount,
  onAmountChange,
  onSubmit,
  submitting,
  error,
}: {
  availableCents: number;
  pendingCents: number;
  inReviewCents: number;
  amount: string;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const p = usePalette();

  return (
    <View className="gap-1.5 rounded-[28px] border border-deck-border bg-deck p-5">
      <Text className="text-sm font-semibold text-deck-muted">Disponível para saque</Text>
      <Text className="font-poppins-extrabold text-[40px] leading-[48px] text-deck-foreground">
        {brl(availableCents)}
      </Text>

      <View className="mt-1 flex-row flex-wrap gap-2">
        <View className="rounded-full bg-deck-foreground/10 px-3 py-1.5">
          <Text className="text-[13px] text-deck-muted">
            Pendente <Text className="font-semibold text-deck-foreground">{brl(pendingCents)}</Text>
          </Text>
        </View>
        <View className="rounded-full bg-deck-foreground/10 px-3 py-1.5">
          <Text className="text-[13px] text-deck-muted">
            Em análise <Text className="font-semibold text-deck-foreground">{brl(inReviewCents)}</Text>
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row gap-3">
        <View className="h-14 flex-1 flex-row items-center gap-1.5 rounded-2xl border border-deck-foreground/20 bg-deck-foreground/10 px-4">
          <Text className="text-[15px] text-deck-muted">R$</Text>
          <TextInput
            accessibilityLabel="Valor do saque"
            value={amount}
            onChangeText={onAmountChange}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor={p.deckMuted}
            className="flex-1 font-poppins-semibold text-lg text-deck-foreground"
          />
        </View>
        <View className="w-28">
          <Button label="Sacar" height="h-14" loading={submitting} onPress={onSubmit} />
        </View>
      </View>

      {error ? (
        <Text accessibilityRole="alert" className="mt-1 text-sm font-semibold text-deck-foreground">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 5:** Rodar os dois testes de novo (um por chamada) → PASS.

- [ ] **Step 6: Reescrever o render de `app/(tabs)/wallet.tsx`**

Imports: remover `Input`, a função local `brl` e `ENTRY_LABEL`; trocar `import { FlatList, Text, View } from "react-native";` por `import { FlatList, Pressable, Text, View } from "react-native";` e acrescentar:

```tsx
import { BalanceCard } from "../../src/ui/BalanceCard";
import { LedgerRow } from "../../src/ui/LedgerRow";
import { brl } from "../../src/lib/money";
```
(`Button` deixa de ser usado: remover o import.) Substituir tudo a partir de `if (isLoading || !balance)` por:

```tsx
  if (isLoading || !balance) return <LoadingSpinner />;

  return (
    <Screen>
      <FlatList
        data={balance.recent_entries}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
        ListHeaderComponent={
          <View className="gap-5 pb-4 pt-2">
            <Text className="font-poppins-extrabold text-[28px] leading-9 text-foreground">Carteira</Text>
            <BalanceCard
              availableCents={balance.available_cents}
              pendingCents={balance.pending_cents}
              inReviewCents={balance.in_review_cents}
              amount={amount}
              onAmountChange={setAmount}
              onSubmit={() => void handleWithdraw()}
              submitting={submitting}
              error={error}
            />
            <View className="flex-row items-center justify-between">
              <Text className="font-poppins-bold text-lg text-foreground">Extrato</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/withdrawals")}
                className="min-h-11 justify-center active:opacity-60"
              >
                <Text className="text-[15px] font-semibold text-primary-text">Histórico de saques</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => <LedgerRow entry={item} />}
        ListEmptyComponent={
          <Text className="py-6 text-center text-base text-muted-foreground">
            Seus ganhos aparecem aqui depois da primeira entrega.
          </Text>
        }
      />
    </Screen>
  );
}
```
O `handleWithdraw`, `MIN_WITHDRAWAL_CENTS` e os estados continuam como estão (a mensagem de valor mínimo usa o `brl` importado).

- [ ] **Step 7:** `npx tsc --noEmit` → sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/ui/LedgerRow.tsx src/ui/LedgerRow.test.tsx src/ui/BalanceCard.tsx src/ui/BalanceCard.test.tsx "app/(tabs)/wallet.tsx"
git commit -m "feat(driver): carteira com saldo em destaque e extrato com sinal"
```

---

### Task 13: Perfil e barra de abas

**Files:**
- Modify: `app/(tabs)/profile.tsx` (imports, `usePalette`, o `return`; estados e `handleSave` ficam)
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: `profile.tsx` — imports e hook**

Trocar `import { FileText, Headphones, Trash2 } from "lucide-react-native";` por `import { Bike, FileText, Headphones, LogOut, Trash2 } from "lucide-react-native";` e acrescentar:

```tsx
import { Avatar } from "../../src/ui/Avatar";
import { ListGroup, ListRow } from "../../src/ui/ListGroup";
import { usePalette } from "../../src/ui/theme";
```
Dentro do componente, logo após `const { driver, refreshDriver } = useDriver();`: `const p = usePalette();`. O `import { Pressable, Text, View }` continua.

- [ ] **Step 2: `profile.tsx` — render**

Substituir tudo depois de `if (!driver) return null;` por:

```tsx
  return (
    <Screen>
      <KeyboardAwareScroll
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-5 pb-10 pt-2"
      >
        <View className="flex-row items-center gap-4">
          <Avatar name={driver.tx_full_name} size={64} />
          <View className="flex-1 gap-1.5">
            <Text className="font-poppins-bold text-[22px] leading-7 text-foreground">
              {driver.tx_full_name}
            </Text>
            <Text className="text-sm text-muted-foreground">Entregador em {driver.tx_city}</Text>
            {driver.tx_vehicle_type ? (
              <View className="flex-row items-center gap-1.5 self-start rounded-full bg-muted px-2.5 py-1.5">
                <Bike size={16} color={p.primaryText} />
                <Text className="text-[13px] font-semibold text-foreground">
                  {driver.tx_vehicle_type}
                  {driver.tx_vehicle_plate ? ` · ${driver.tx_vehicle_plate}` : ""}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="gap-4">
          <Text className="font-poppins-bold text-lg text-foreground">Seus dados</Text>
          <Input label="Nome completo" value={fullName} onChangeText={setFullName} />
          <Input label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Tipo de veículo" value={vehicleType} onChangeText={setVehicleType} />
          <Input
            label="Placa"
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
            autoCapitalize="characters"
          />
          {/* manter aqui o <Input label="Chave PIX (deixe em branco para manter a atual)" ... /> original, com as mesmas props */}
        </View>

        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
        {success ? <Text className="text-sm font-semibold text-money">{success}</Text> : null}

        <Button label="Salvar alterações" loading={submitting} onPress={() => void handleSave()} />

        <ListGroup>
          <ListRow icon={Headphones} label="Ajuda e suporte" onPress={() => void openSupport()} />
          <ListRow icon={FileText} label="Termos e privacidade" onPress={() => router.push("/legal")} />
          <ListRow icon={LogOut} label="Sair da conta" chevron={false} last onPress={() => void logout()} />
        </ListGroup>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/delete-account")}
          className="min-h-11 flex-row items-center justify-center gap-2 active:opacity-70"
        >
          <Trash2 color={p.mutedForeground} size={16} />
          <Text className="text-sm font-medium text-muted-foreground">Excluir minha conta</Text>
        </Pressable>
      </KeyboardAwareScroll>
    </Screen>
  );
}
```
Atenção: o comentário `{/* manter aqui … */}` marca a posição do campo **Chave PIX original**; ao editar, **copiar o `<Input>` de PIX do arquivo atual** (mesmas props `value={pixKey}`, `onChangeText={setPixKey}`, etc.) e apagar o comentário.

- [ ] **Step 3: `app/(tabs)/_layout.tsx`** — manter a guarda de autenticação e as 4 telas; trocar cores e ícone:

```tsx
import { Redirect, Tabs } from "expo-router";
import { View } from "react-native";
import { Home, Wallet, Bell, User } from "lucide-react-native";
import type { ComponentType } from "react";
import { useAuth } from "../../src/auth/AuthContext";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";
import { usePalette } from "../../src/ui/theme";

type IconComponent = ComponentType<{ size?: number; color?: string }>;

function TabIcon({ icon: Icon, focused, size }: { icon: IconComponent; focused: boolean; size: number }) {
  const p = usePalette();
  return (
    <View
      className={`h-8 w-14 items-center justify-center rounded-full ${focused ? "bg-primary" : ""}`}
    >
      <Icon size={size} color={focused ? p.primaryForeground : p.mutedForeground} />
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const p = usePalette();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.foreground,
        tabBarInactiveTintColor: p.mutedForeground,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarStyle: { backgroundColor: p.card, borderTopColor: p.border },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Início", tabBarIcon: ({ focused, size }) => <TabIcon icon={Home} focused={focused} size={size} /> }} />
      <Tabs.Screen name="wallet" options={{ title: "Carteira", tabBarIcon: ({ focused, size }) => <TabIcon icon={Wallet} focused={focused} size={size} /> }} />
      <Tabs.Screen name="notifications" options={{ title: "Avisos", tabBarIcon: ({ focused, size }) => <TabIcon icon={Bell} focused={focused} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil", tabBarIcon: ({ focused, size }) => <TabIcon icon={User} focused={focused} size={size} /> }} />
    </Tabs>
  );
}
```
Antes de substituir, abrir o arquivo atual e **conferir os `name` das telas e o que mais ele faz** (linhas 1–21); se houver algo além disso (ex.: guarda de status do entregador), preservar.

- [ ] **Step 4:** `npx tsc --noEmit` → sem erros.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/profile.tsx" "app/(tabs)/_layout.tsx"
git commit -m "feat(driver): perfil com identidade e abas com indicador"
```

---

### Task 14: Demais telas — cores escritas direto e texto laranja

**Files:** os arquivos com cor hex ou `text-primary` (levantar com os comandos abaixo).

- [ ] **Step 1: Levantar**

Run: `grep -rnE "#[0-9A-Fa-f]{6}" app src --include=*.tsx | grep -v "\.test\." | grep -v "src/ui/theme.ts"`
Run: `grep -rn "text-primary\b" app src --include=*.tsx | grep -v "text-primary-" | grep -v "\.test\."`

- [ ] **Step 2: Aplicar a tabela**

| Onde aparece | Trocar por |
| --- | --- |
| `#F59E0B` | `p.primary` |
| `#1F1F1F` (ícone/texto sobre claro) | `p.foreground`; sobre fundo laranja, `p.primaryForeground` |
| `#6B7280`, `#9CA3AF`, `#C4C4C4` | `p.mutedForeground` |
| `#E53935` | `p.destructive` |
| `#16A34A` | `p.money` |
| `#FFFFFF` em ícone de botão destrutivo | `p.destructiveForeground` |
| classe `text-primary` (sem sufixo) | `text-primary-text` |

Em cada componente que passar a usar `p`: `import { usePalette } from "<caminho>/ui/theme";` e `const p = usePalette();` **no topo do corpo do componente, antes de qualquer `return` condicional**. Arquivos esperados: `src/ui/IconBadge.tsx`, `src/ui/CityRadioList.tsx`, `src/ui/AuthHeader.tsx`, `app/legal/index.tsx`, `app/delete-account.tsx`, `app/(auth)/login.tsx`.

- [ ] **Step 3: Verificar que acabou**

Run: o primeiro `grep` do Step 1 de novo → **nenhuma linha**.
Run: `grep -rnE "text-\[(9|10|11)px\]" app src --include=*.tsx | grep -v "\.test\."` → nenhuma linha (trocar por `text-xs`/`text-[13px]` se aparecer).
Run: `grep -rnE "h-(8|9|10) w-(8|9|10)" app src --include=*.tsx | grep -v "\.test\."` → para cada resultado que for `Pressable`, subir para `h-11 w-11` ou acrescentar `hitSlop={12}`.
Run: `grep -rn "text-white" app src --include=*.tsx | grep -v "\.test\."` → conferir que nenhum está sobre `bg-primary`.

- [ ] **Step 4: Typecheck e testes das telas afetadas (um por chamada)**

`npx tsc --noEmit` → sem erros. Depois, cada um em chamada separada:
`npx jest "app/(auth)/login.test.tsx"`, `npx jest "app/(auth)/register.test.tsx"`, `npx jest "app/(auth)/forgot-password.test.tsx"`, `npx jest app/driver-signup.test.tsx`, `npx jest app/delete-account.test.tsx`, `npx jest app/legal/index.test.tsx`, `npx jest "app/legal/[slug].test.tsx"` → todos PASS. Se algum falhar por texto ou classe, ajustar **o teste só se o texto da tela mudou de propósito**; senão corrigir a tela.

- [ ] **Step 5: Commit**

```bash
git add -A app src
git commit -m "feat(driver): demais telas com tokens de tema e texto laranja acessivel"
```

---

### Task 15: Prévia no navegador e verificação visual

**Files (temporários, não entram no commit final):**
- Create: `app/__preview.tsx`
- Modify (temporário): `metro.config.js`

- [ ] **Step 1: Stub do mapa na web (temporário)**

Abrir `metro.config.js`; antes do `module.exports`, acrescentar:

```js
const upstreamResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return { type: "empty" };
  }
  return (upstreamResolve ?? context.resolveRequest)(context, moduleName, platform);
};
```
(ajustando `config` para o nome da variável que o arquivo já usa).

- [ ] **Step 2: `app/__preview.tsx`**

```tsx
import { Redirect } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Headphones, FileText, LogOut } from "lucide-react-native";
import { ThemeRoot } from "../src/ui/ThemeRoot";
import { StateCard } from "../src/ui/StateCard";
import { OfferSheet } from "../src/ui/OfferSheet";
import { BalanceCard } from "../src/ui/BalanceCard";
import { LedgerRow } from "../src/ui/LedgerRow";
import { StepTracker } from "../src/ui/StepTracker";
import { Avatar } from "../src/ui/Avatar";
import { Button } from "../src/ui/Button";
import { ListGroup, ListRow } from "../src/ui/ListGroup";
import type { Scheme } from "../src/ui/theme";
import type { DeliveryOffer } from "../src/@types/driver";

const NOW = Date.now();
const offer: DeliveryOffer = {
  id_delivery_offer: "o1", id_order: "p1", id_establishment: "e1", id_driver: "d1",
  enum_status: "OFFERED", int_payout_cents: 850,
  dt_offered_at: new Date(NOW - 12_000).toISOString(),
  dt_expires_at: new Date(NOW + 18_000).toISOString(),
  pickup_name: "Cantinho da Dona Rosa", pickup_district: "Centro", dropoff_district: "Vila Nova",
};
const noop = () => {};

function Panel({ scheme }: { scheme: Scheme }) {
  return (
    <View style={{ width: 380, height: 1500 }}>
      <ThemeRoot scheme={scheme}>
        <View className="flex-1 gap-5 bg-background p-4">
          <Text className="font-poppins-bold text-lg text-foreground">Tema {scheme}</Text>
          <View className="flex-row items-center gap-3"><Avatar name="Marcos Vinícius Sousa" /><Text className="font-poppins-bold text-xl text-foreground">Olá, Marcos</Text></View>
          <StateCard online busy={false} onToggle={noop} />
          <StateCard online={false} busy={false} onToggle={noop} />
          <BalanceCard availableCents={18640} pendingCents={2400} inReviewCents={0} amount="" onAmountChange={noop} onSubmit={noop} submitting={false} error={null} />
          <LedgerRow entry={{ id: "1", type: "DRIVER_EARNING", amount_cents: 850, status: "AVAILABLE", order_id: null, occurred_at: "2026-10-28T12:00:00.000Z" }} />
          <LedgerRow entry={{ id: "2", type: "WITHDRAWAL", amount_cents: -12000, status: "PAID", order_id: null, occurred_at: "2026-10-27T12:00:00.000Z" }} />
          <StepTracker status="PICKED_UP" />
          <Button label="Retirei o pedido" onPress={noop} />
          <Button label="Recusar" variant="outline" onPress={noop} />
          <Button label="Ver detalhes" variant="ghost" onPress={noop} />
          <ListGroup>
            <ListRow icon={Headphones} label="Ajuda e suporte" onPress={noop} />
            <ListRow icon={FileText} label="Termos e privacidade" onPress={noop} />
            <ListRow icon={LogOut} label="Sair da conta" chevron={false} last onPress={noop} />
          </ListGroup>
        </View>
      </ThemeRoot>
    </View>
  );
}

function OfferPanel({ scheme }: { scheme: Scheme }) {
  return (
    <View style={{ width: 380, height: 560 }}>
      <ThemeRoot scheme={scheme}>
        <View className="flex-1 bg-background">
          <OfferSheet offer={offer} queued={1} onAccept={noop} onDecline={noop} />
        </View>
      </ThemeRoot>
    </View>
  );
}

export default function Preview() {
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <ScrollView>
      <View style={{ flexDirection: "row", gap: 16, padding: 16, flexWrap: "wrap" }}>
        <Panel scheme="light" />
        <Panel scheme="dark" />
        <View style={{ gap: 16 }}>
          <OfferPanel scheme="light" />
          <OfferPanel scheme="dark" />
        </View>
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 3: Subir a web e tirar print**

Run (em segundo plano): `cd /home/antonio/the-code/fominha/fominha-driver && npx expo start --web --port 8099`
Aguardar o bundle e então:
`CHROME=$(ls -d ~/.cache/ms-playwright/chromium-1243/chrome-linux*/chrome | head -1); "$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=20000 --window-size=1400,1600 --screenshot=/tmp/claude-1000/-home-antonio-the-code-fominha/e24a1a66-5cf0-4f50-828f-9870432d2d0f/scratchpad/preview.png http://localhost:8099/__preview`
Abrir o PNG e conferir: cores corretas nos dois temas, Poppins aplicada, `bg-primary/10`-style translúcidos visíveis, texto laranja legível, botões do tamanho certo.

- [ ] **Step 4: Decidir**

Se as variáveis de cor **não** aplicarem (tela sem cor/tudo preto-branco): trocar a estratégia de `ThemeRoot` para estilos inline via `usePalette` nos componentes base, e registrar o motivo no commit. Se aplicarem, seguir.

- [ ] **Step 5: Limpar**

Parar o servidor. `rm app/__preview.tsx && git checkout metro.config.js`. `git status` deve mostrar a árvore limpa.

---

### Task 16: Revisão final

- [ ] **Step 1:** `npx tsc --noEmit` → sem erros.
- [ ] **Step 2:** Rodar, **um por chamada**, todos os testes novos (`theme`, `money`, `Button`, `Avatar`, `ListGroup`, `CountdownRing`, `RouteLegs`, `OfferSheet`, `StateCard`, `StepTracker`, `LedgerRow`, `BalanceCard`) e os já listados na Task 14 → todos PASS. No back, `offer-view.spec.ts` → PASS.
- [ ] **Step 3:** Conferir que a lógica não mudou: `git diff main~N -- src/driver src/auth src/api src/maps src/push` não pode mostrar nada além de `src/@types/driver.ts`.
- [ ] **Step 4:** Revisar cada tela com a skill apple-design (acessibilidade, convenções, craft) nos dois temas, usando a prévia da Task 15 como referência, e corrigir o que for Crítico ou Alto.
- [ ] **Step 5:** Atualizar a memória do projeto (`fominha-redesign-driver.md`) com o status e listar o que o usuário precisa conferir no aparelho (tema escuro no sol, mapa, modal do código, fonte Poppins carregando, build na nuvem via EAS).
- [ ] **Step 6:** Perguntar ao usuário antes de qualquer push dos dois repositórios.

---

## Auto-revisão do plano

**Cobertura da spec:** tokens e temas (Tasks 2–3), Poppins (1, 3), botão e campos (5–6), Início e oferta (8–9), back (10), entrega ativa (11), carteira (12), perfil e abas (13), demais telas e hex (14), acessibilidade e movimento reduzido (anel estático, sem animação nova; rótulos nos componentes), testes (todas as tasks), verificação (15–16). Distância em km foi removida da spec e do plano porque o banco não guarda coordenadas.

**Riscos conhecidos:** (1) o `<alpha-value>` com variáveis no NativeWind e as variáveis chegando até dentro do `Modal` só se confirmam na prévia (Task 15) e no aparelho; há plano B na Task 15. (2) `expo install` precisa de rede. (3) `KeyboardAwareScroll` pode precisar de `flex: 1` (Task 11, Step 7).

**Consistência de nomes:** `usePalette`, `useScheme`, `ThemeRoot`, `cssVars`, `brl`, `OfferSheet`, `offerLifetimeSeconds`, `CountdownRing`, `ringOffset`, `RouteLegs`, `StateCard`, `StepTracker`, `currentStep`, `BalanceCard`, `LedgerRow`, `formatSigned`, `ListGroup`, `ListRow`, `Avatar`, `initialsOf`, `toOfferView` — usados com a mesma assinatura em todas as tasks.

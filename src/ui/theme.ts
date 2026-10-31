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

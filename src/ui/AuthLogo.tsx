import { Image } from "react-native";

const logo = require("../../assets/fominha-logo.png");
// Proporção real do PNG (1672x941) — com isso a caixa do Image já nasce do
// tamanho exato da arte, sem sobra transparente nas laterais que empurraria
// a logo pra longe da margem esquerda dentro do `contain`.
const LOGO_ASPECT_RATIO = 1672 / 941;

export function AuthLogo({ className = "h-20" }: { className?: string }) {
  return (
    <Image
      source={logo}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
      accessibilityLabel="Fominha"
      style={{ aspectRatio: LOGO_ASPECT_RATIO, alignSelf: "flex-start" }}
      className={className}
    />
  );
}

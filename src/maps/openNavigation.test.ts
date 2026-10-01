import { Linking, Platform } from "react-native";
import { openNavigation } from "./openNavigation";

// Nota de implementação: jest.mock("react-native", factory) com uma factory
// "enxuta" (só Linking/Platform) quebra o ambiente deste repo — o preset
// jest-expo + react-native-css-interop (NativeWind) avaliam getters do
// módulo real "react-native" de forma eager durante o auto-mock de
// componentes nativos, e crasham com "Cannot read properties of undefined
// (reading 'getColorScheme'/'Component')" assim que "react-native" é
// substituído por um objeto que não tem o resto da API. Isso acontece até
// com um teste "dummy" que não usa openNavigation, então não é algo que dê
// pra contornar na implementação — é um conflito de infraestrutura de teste.
// Por isso, aqui a gente faz spy nos métodos do módulo real (Linking) e
// sobrescreve Platform.OS com Object.defineProperty, em vez de mockar o
// módulo "react-native" inteiro. O comportamento testado é o mesmo.
function setPlatformOS(os: string): void {
  Object.defineProperty(Platform, "OS", { value: os, configurable: true });
}

describe("openNavigation", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    jest.restoreAllMocks();
    setPlatformOS(originalOS);
  });

  it("no Android, abre o Google Maps com google.navigation", async () => {
    setPlatformOS("android");
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    await openNavigation({ latitude: -3.7, longitude: -45.3 });

    expect(openURLSpy).toHaveBeenCalledWith("google.navigation:q=-3.7,-45.3");
  });

  it("no iOS, abre o app do Google Maps quando instalado", async () => {
    setPlatformOS("ios");
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    await openNavigation({ latitude: -3.7, longitude: -45.3 });

    expect(openURLSpy).toHaveBeenCalledWith(
      "comgooglemaps://?daddr=-3.7,-45.3&directionsmode=driving"
    );
  });

  it("no iOS sem o Google Maps instalado, cai pro Apple Maps", async () => {
    setPlatformOS("ios");
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    await openNavigation({ latitude: -3.7, longitude: -45.3 });

    expect(openURLSpy).toHaveBeenCalledWith(
      "https://maps.apple.com/?daddr=-3.7,-45.3&dirflg=d"
    );
  });
});

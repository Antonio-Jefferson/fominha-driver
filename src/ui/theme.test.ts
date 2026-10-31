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

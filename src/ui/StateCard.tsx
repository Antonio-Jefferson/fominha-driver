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

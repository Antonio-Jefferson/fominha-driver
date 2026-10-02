import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const LENGTH = 4;
const RESEND_SECONDS = 60;

function formatSeconds(total: number) {
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/**
 * Entrada de código de verificação em 4 caixas. O `TextInput` real fica
 * escondido (tamanho zero) e recebe o foco ao tocar nas caixas — é ele quem
 * carrega o `accessibilityLabel="Código"` testado no restante do app.
 */
export function OtpInput({
  value,
  onChangeText,
  resend,
}: {
  value: string;
  onChangeText: (code: string) => void;
  /** Quando informado, mostra a contagem regressiva e o link de reenvio. */
  resend?: { onPress: () => void; loading?: boolean };
}) {
  const inputRef = useRef<TextInput>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!resend || secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resend, secondsLeft]);

  function handleResend() {
    resend?.onPress();
    setSecondsLeft(RESEND_SECONDS);
  }

  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  return (
    <View className="gap-3">
      <Pressable
        onPress={() => inputRef.current?.focus()}
        className="flex-row justify-between"
      >
        {digits.map((digit, i) => {
          const active = i === value.length;
          return (
            <View
              key={i}
              className={`h-14 w-12 items-center justify-center rounded-xl border-2 bg-background ${
                digit || active ? "border-primary" : "border-border"
              }`}
            >
              <Text className="text-xl font-bold text-foreground">{digit}</Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, "").slice(0, LENGTH))}
        keyboardType="number-pad"
        maxLength={LENGTH}
        accessibilityLabel="Código"
        autoFocus
        className="h-0 w-0 opacity-0"
      />

      {resend ? (
        secondsLeft > 0 ? (
          <Text className="text-sm text-muted-foreground">
            Reenviar em <Text className="font-semibold">{formatSeconds(secondsLeft)}</Text>
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={resend.loading}
            onPress={handleResend}
          >
            <Text className="text-sm font-semibold text-primary">Reenviar código</Text>
          </Pressable>
        )
      ) : null}
    </View>
  );
}

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

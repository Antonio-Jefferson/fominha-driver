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

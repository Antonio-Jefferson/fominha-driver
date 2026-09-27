import type { ComponentType, ReactNode } from "react";
import { Text, View } from "react-native";
import { Button } from "./Button";

type ActionIcon = ComponentType<{ size?: number; color?: string }>;

export function EmptyState({
  title,
  description,
  illustration,
  badge,
  action,
}: {
  title: string;
  description?: string;
  /** Conteúdo ilustrativo opcional, renderizado acima do título. */
  illustration?: ReactNode;
  /** Selo opcional (ex.: garantia de segurança), renderizado abaixo da descrição. */
  badge?: ReactNode;
  action?: {
    label: string;
    onPress: () => void;
    icon?: ActionIcon;
    /** Classe de border-radius do botão de ação (repassada ao Button). Padrão: "rounded". */
    rounded?: string;
    /** Classe de altura do botão de ação (repassada ao Button). Padrão: "h-12". */
    height?: string;
  };
}) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-8">
      {illustration}
      <Text className="text-center text-lg font-semibold text-foreground">
        {title}
      </Text>
      {description ? (
        <Text className="text-center text-sm text-muted-foreground">
          {description}
        </Text>
      ) : null}
      {badge}
      {action ? (
        <View className="mt-4 w-full">
          <Button
            label={action.label}
            variant="outline"
            onPress={action.onPress}
            icon={action.icon}
            rounded={action.rounded}
            height={action.height}
          />
        </View>
      ) : null}
    </View>
  );
}

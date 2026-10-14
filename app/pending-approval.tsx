import { useEffect } from "react";
import { Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Screen } from "../src/ui/Screen";
import { Button } from "../src/ui/Button";
import { useAuth } from "../src/auth/AuthContext";
import { useDriver } from "../src/driver/DriverContext";
import { DriverLoadError } from "../src/ui/DriverLoadError";

const REASON_BY_STATUS: Record<string, { title: string; description: string }> = {
  PENDING_APPROVAL: {
    title: "Seu cadastro está em análise",
    description:
      "Assim que aprovarmos seus dados, você já pode começar a receber ofertas de entrega.",
  },
  SUSPENDED: {
    title: "Seu cadastro está suspenso",
    description: "Entre em contato com o suporte da Fominha para regularizar.",
  },
  REJECTED: {
    title: "Seu cadastro não foi aprovado",
    description: "Entre em contato com o suporte da Fominha para mais detalhes.",
  },
};

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const { driver, loadError, refreshDriver } = useDriver();

  useEffect(() => {
    if (driver?.enum_status === "ACTIVE") {
      router.replace("/(tabs)/home");
    }
  }, [driver, router]);

  useEffect(() => {
    const interval = setInterval(() => void refreshDriver(), 15_000);
    return () => clearInterval(interval);
  }, [refreshDriver]);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  // Não esconde a tela durante o polling: refreshDriver liga isLoading a cada 15s.
  if (loadError) return <DriverLoadError />;
  if (!driver) return null;

  const content = REASON_BY_STATUS[driver.enum_status] ?? REASON_BY_STATUS.PENDING_APPROVAL;

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text className="text-center text-2xl font-extrabold text-foreground">
          {content.title}
        </Text>
        <Text className="text-center text-base text-muted-foreground">
          {content.description}
        </Text>
        {driver.tx_status_reason ? (
          <Text className="text-center text-sm text-muted-foreground">
            Motivo: {driver.tx_status_reason}
          </Text>
        ) : null}
        <View className="mt-6 w-full gap-3">
          <Button
            label="Verificar novamente"
            variant="outline"
            rounded="rounded-full"
            height="h-14"
            onPress={() => void refreshDriver()}
          />
          <Button
            label="Sair"
            variant="ghost"
            rounded="rounded-full"
            height="h-14"
            onPress={() => void logout()}
          />
        </View>
      </View>
    </Screen>
  );
}

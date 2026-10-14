import { useState } from "react";
import { Text, View } from "react-native";
import { WifiOff } from "lucide-react-native";
import { Screen } from "./Screen";
import { Button } from "./Button";
import { IconBadge } from "./IconBadge";
import { useAuth } from "../auth/AuthContext";
import { useDriver } from "../driver/DriverContext";

/**
 * Mostrada quando não deu pra consultar o cadastro de entregador. Evita mandar
 * quem já é entregador para o formulário de cadastro por causa de uma falha
 * passageira de rede/servidor.
 */
export function DriverLoadError() {
  const { logout } = useAuth();
  const { refreshDriver } = useDriver();
  const [retrying, setRetrying] = useState(false);

  async function retry() {
    setRetrying(true);
    try {
      await refreshDriver();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-3 px-3">
        <IconBadge icon={WifiOff} />
        <Text className="mt-2 text-center text-2xl font-extrabold text-foreground">
          Não conseguimos carregar seu cadastro
        </Text>
        <Text className="text-center text-base text-muted-foreground">
          Pode ser sua conexão ou uma instabilidade nossa. Seus dados estão
          seguros — tente de novo em instantes.
        </Text>
        <View className="mt-6 w-full gap-3">
          <Button
            label="Tentar novamente"
            loading={retrying}
            rounded="rounded-full"
            height="h-14"
            textSize="text-lg"
            onPress={() => void retry()}
          />
          <Button
            label="Sair da conta"
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

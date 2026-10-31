import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { TriangleAlert } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { Screen } from "../src/ui/Screen";
import { Input } from "../src/ui/Input";
import { Button } from "../src/ui/Button";
import { useAuth } from "../src/auth/AuthContext";
import { deleteAccount } from "../src/api/auth";
import { ApiError } from "../src/api/errors";

const WHAT_HAPPENS = [
  "Seu nome, CPF, telefone, foto, placa e chave PIX são apagados.",
  "Antes de excluir, saque todo o saldo da carteira: com saldo ou saque em andamento a exclusão é recusada.",
  "As entregas já feitas ficam no histórico, sem os seus dados, pelo prazo que a lei exige.",
  "Não dá para desfazer. Para voltar, será preciso fazer um cadastro novo.",
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function confirmDeletion() {
    setSubmitting(true);
    setError(null);
    try {
      await deleteAccount(password);
      await logout();
      Toast.show({ type: "success", text1: "Sua conta foi excluída" });
      router.replace("/(auth)/login");
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Não foi possível excluir a conta agora."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function askConfirmation() {
    if (!password) {
      setError("Digite sua senha para confirmar.");
      return;
    }
    Alert.alert(
      "Excluir conta",
      "Tem certeza? Essa ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => void confirmDeletion(),
        },
      ]
    );
  }

  return (
    <Screen keyboard="scroll">
      <View className="mt-6 flex-1 gap-6">
        <View className="flex-row items-center gap-3 rounded-2xl bg-destructive/10 p-4">
          <TriangleAlert color="#E53935" size={22} />
          <Text className="flex-1 text-sm font-medium text-foreground">
            Ao excluir a conta, você perde o acesso ao app com este e-mail.
          </Text>
        </View>

        <View className="gap-3">
          {WHAT_HAPPENS.map((line) => (
            <View key={line} className="flex-row gap-2">
              <Text className="text-base text-muted-foreground">•</Text>
              <Text className="flex-1 text-base text-foreground">{line}</Text>
            </View>
          ))}
        </View>

        <Input
          label="Sua senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          rounded="rounded-full"
          height="h-14"
          error={error ?? undefined}
        />

        <View className="flex-1" />

        <View className="mb-4 gap-3">
          <Button
            label="Excluir minha conta"
            loading={submitting}
            rounded="rounded-full"
            height="h-14"
            variant="destructive"
            onPress={askConfirmation}
          />
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </Screen>
  );
}

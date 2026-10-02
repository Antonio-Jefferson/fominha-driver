import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Mail } from "lucide-react-native";
import { Screen } from "../../src/ui/Screen";
import { Input } from "../../src/ui/Input";
import { Button } from "../../src/ui/Button";
import { IconBadge } from "../../src/ui/IconBadge";
import { OtpInput } from "../../src/ui/OtpInput";
import { requestPasswordReset, resetPassword } from "../../src/api/auth";
import { emailSchema, resetPasswordSchema } from "../../src/lib/validation";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function fail(err: unknown, fallback: string) {
    setError(err instanceof Error ? err.message : fallback);
  }

  async function handleRequestCode() {
    setError(null);

    const parsed = emailSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setStep("reset");
    } catch (err) {
      fail(err, "Não foi possível enviar o código.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    setError(null);

    if (code.length !== 4) {
      setError("Digite o código de 4 dígitos");
      return;
    }

    const parsed = resetPasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ email, code, newPassword });
      setStep("done");
    } catch (err) {
      fail(err, "Não foi possível redefinir a senha.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      {step !== "done" ? (
        <View className="mt-6">
          <IconBadge icon={Mail} />
        </View>
      ) : null}

      <View className="mt-4 gap-2">
        <Text className="text-3xl font-extrabold text-foreground">
          {step === "email"
            ? "Esqueceu a senha?"
            : step === "reset"
              ? "Criar nova senha"
              : "Tudo certo."}
        </Text>
        <Text className="text-base text-muted-foreground">
          {step === "email"
            ? "Informe o e-mail da conta e enviamos um código para você criar uma nova."
            : step === "reset"
              ? `Código enviado para ${email}.`
              : "Senha redefinida com sucesso."}
        </Text>
      </View>

      <View className="mt-8 gap-4">
        {step === "email" ? (
          <>
            <Input
              label="E-mail"
              placeholder="voce@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              rounded="rounded-full"
              height="h-14"
            />
            <Button
              label="Enviar código"
              loading={submitting}
              rounded="rounded-full"
              height="h-14"
              textSize="text-lg"
              onPress={() => void handleRequestCode()}
            />
          </>
        ) : null}

        {step === "reset" ? (
          <>
            <Text className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Código
            </Text>
            <OtpInput value={code} onChangeText={setCode} />
            <Input
              label="Nova senha"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              rounded="rounded-full"
              height="h-14"
            />
            <Input
              label="Confirmar senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              rounded="rounded-full"
              height="h-14"
            />
            <Button
              label="Redefinir senha"
              loading={submitting}
              rounded="rounded-full"
              height="h-14"
              textSize="text-lg"
              onPress={() => void handleReset()}
            />
          </>
        ) : null}

        {step === "done" ? (
          <Button
            label="Ir para o login"
            rounded="rounded-full"
            height="h-14"
            textSize="text-lg"
            onPress={() => router.replace("/(auth)/login")}
          />
        ) : null}

        {error ? (
          <Text className="text-sm text-destructive">{error}</Text>
        ) : null}

        {step !== "done" ? (
          <Button
            label="Voltar ao login"
            variant="ghost"
            rounded="rounded-full"
            height="h-14"
            onPress={() => router.replace("/(auth)/login")}
          />
        ) : null}
      </View>
    </Screen>
  );
}

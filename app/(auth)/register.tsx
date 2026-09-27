import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, Mail } from "lucide-react-native";
import { Screen } from "../../src/ui/Screen";
import { Input } from "../../src/ui/Input";
import { Button } from "../../src/ui/Button";
import { AcceptanceCheckboxes } from "../../src/ui/AcceptanceCheckboxes";
import { StepProgress } from "../../src/ui/StepProgress";
import { IconBadge } from "../../src/ui/IconBadge";
import { OtpInput } from "../../src/ui/OtpInput";
import { CityRadioList } from "../../src/ui/CityRadioList";
import { useAuth } from "../../src/auth/AuthContext";
import {
  confirmVerificationCode,
  requestVerificationCode,
  signup,
} from "../../src/api/auth";
import type { AllowedCity } from "../../src/@types/auth";
import { signupSchema } from "../../src/lib/validation";

type Step = "email" | "code" | "details";

const STEP_NUMBER: Record<Step, number> = { email: 1, code: 2, details: 3 };

// Mesma lista de ALLOWED_CITIES, só reordenada pra bater com o design.
const CITY_DISPLAY_ORDER: AllowedCity[] = [
  "Santa Inês",
  "Zé Doca",
  "Bom Jardim",
  "Gov. Newton Bello",
];

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState<AllowedCity | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState<string[]>([]);
  const [acceptedTermsError, setAcceptedTermsError] = useState<
    string | undefined
  >(undefined);

  function fail(err: unknown, fallback: string) {
    setError(err instanceof Error ? err.message : fallback);
  }

  async function handleRequestCode() {
    setError(null);
    setSubmitting(true);
    try {
      await requestVerificationCode({ email, name: fullName });
      setStep("code");
    } catch (err) {
      fail(err, "Não foi possível enviar o código.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmCode() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await confirmVerificationCode({ email, code });
      setSignupToken(res.signupToken);
      setStep("details");
    } catch (err) {
      fail(err, "Não foi possível confirmar o código.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup() {
    setError(null);
    setAcceptedTermsError(undefined);

    const parsed = signupSchema.safeParse({
      fullName,
      email,
      phone,
      city,
      password,
      confirmPassword,
      acceptedTerms,
    });
    if (!parsed.success) {
      const termsIssue = parsed.error.issues.find(
        (issue) => issue.path[0] === "acceptedTerms"
      );
      if (termsIssue) {
        setAcceptedTermsError(termsIssue.message);
      }
      // Erro dos termos já aparece junto aos checkboxes — evita duplicar o
      // texto no banner geral quando esse é o único problema do formulário.
      const otherIssue = parsed.error.issues.find(
        (issue) => issue.path[0] !== "acceptedTerms"
      );
      if (otherIssue) {
        setError(otherIssue.message);
      }
      return;
    }
    if (!signupToken) {
      setError("Confirme seu e-mail antes de criar a conta.");
      return;
    }

    setSubmitting(true);
    try {
      // O signup não devolve sessão — por isso o login logo em seguida.
      await signup({
        fullName,
        email,
        phone,
        city: parsed.data.city,
        password,
        signupToken,
        acceptedTerms: parsed.data.acceptedTerms,
      });
      await login({ email, password });
      router.replace("/(tabs)/home");
    } catch (err) {
      fail(err, "Não foi possível criar a conta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-4">
          <StepProgress step={STEP_NUMBER[step]} />
        </View>

        {step === "code" ? (
          <View className="mt-6">
            <IconBadge icon={Mail} />
          </View>
        ) : null}

        <View className="mt-4 gap-2">
          <Text className="text-3xl font-extrabold text-foreground">
            {step === "email"
              ? "Como podemos te chamar?"
              : step === "code"
                ? "Confirme seu e-mail"
                : "Sua cidade e sua senha"}
          </Text>
          <Text className="text-base text-muted-foreground">
            {step === "email"
              ? "Só o essencial para começar."
              : step === "code"
                ? `Código de 6 dígitos enviado para ${email}.`
                : "A cidade define quais lojas aparecem para você."}
          </Text>
        </View>

        <View className="mt-8 gap-4">
          {step === "email" ? (
            <>
              <Input
                label="Nome completo"
                placeholder="Maria Souza"
                value={fullName}
                onChangeText={setFullName}
                autoComplete="name"
                rounded="rounded-full"
                height="h-14"
              />
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

              <View className="mt-2 gap-3">
                <Button
                  label="Enviar código"
                  icon={ArrowRight}
                  loading={submitting}
                  rounded="rounded-full"
                  height="h-14"
                  textSize="text-lg"
                  onPress={() => void handleRequestCode()}
                />
                <Button
                  label="Já tem conta? Entrar"
                  variant="ghost"
                  rounded="rounded-full"
                  height="h-14"
                  onPress={() => router.replace("/(auth)/login")}
                />
              </View>
            </>
          ) : null}

          {step === "code" ? (
            <>
              <OtpInput
                value={code}
                onChangeText={setCode}
                resend={{ onPress: () => void handleRequestCode(), loading: submitting }}
              />

              <View className="mt-2 gap-3">
                <Button
                  label="Confirmar código"
                  loading={submitting}
                  rounded="rounded-full"
                  height="h-14"
                  textSize="text-lg"
                  onPress={() => void handleConfirmCode()}
                />
                <Button
                  label="Corrigir o e-mail"
                  variant="outline"
                  rounded="rounded-full"
                  height="h-14"
                  textSize="text-lg"
                  onPress={() => setStep("email")}
                />
              </View>
            </>
          ) : null}

          {step === "details" ? (
            <>
              <Input
                label="Telefone (opcional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                rounded="rounded-full"
                height="h-14"
              />

              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">
                  Cidade
                </Text>
                <CityRadioList
                  options={CITY_DISPLAY_ORDER}
                  value={city}
                  onChange={setCity}
                />
              </View>

              <Input
                label="Senha"
                value={password}
                onChangeText={setPassword}
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

              <AcceptanceCheckboxes
                audience="CUSTOMER"
                value={acceptedTerms}
                onChange={setAcceptedTerms}
                error={acceptedTermsError}
              />

              {error ? (
                <Text className="text-sm text-destructive">{error}</Text>
              ) : null}

              <Button
                label="Criar minha conta"
                loading={submitting}
                rounded="rounded-full"
                height="h-14"
                textSize="text-lg"
                onPress={() => void handleSignup()}
              />
            </>
          ) : null}

          {step !== "details" && error ? (
            <Text className="text-sm text-destructive">{error}</Text>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

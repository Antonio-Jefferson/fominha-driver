import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Screen } from "../../src/ui/Screen";
import { Input } from "../../src/ui/Input";
import { Button } from "../../src/ui/Button";
import { AuthLogo } from "../../src/ui/AuthLogo";
import { useAuth } from "../../src/auth/AuthContext";
import { loginSchema, type LoginForm } from "../../src/lib/validation";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginForm) {
    setServerError(null);
    setSubmitting(true);
    try {
      await login({ email: data.email, password: data.password });
      router.replace("/(tabs)/home");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Não foi possível entrar."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center gap-10">
        <View className="gap-8">
          <AuthLogo className="h-24" />
          <View className="gap-2">
            <Text className="text-4xl font-extrabold leading-tight text-foreground">
              Hora de rodar
            </Text>
            <Text className="text-base text-muted-foreground">
              Entre para ver as entregas disponíveis.
            </Text>
          </View>
        </View>

        <View className="gap-5">
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <Input
                label="E-mail"
                placeholder="voce@email.com"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                rounded="rounded-full"
                height="h-14"
                error={formState.errors.email?.message}
              />
            )}
          />

          <View className="gap-2">
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Senha"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  autoComplete="current-password"
                  rounded="rounded-full"
                  height="h-14"
                  error={formState.errors.password?.message}
                />
              )}
            />

            <Pressable
              accessibilityRole="link"
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text className="text-sm font-semibold text-primary">
                Esqueci minha senha
              </Text>
            </Pressable>
          </View>

          {serverError ? (
            <Text className="text-sm text-destructive">{serverError}</Text>
          ) : null}
        </View>

        <View className="gap-3">
          <Button
            label="Entrar"
            loading={submitting}
            rounded="rounded-full"
            height="h-14"
            textSize="text-lg"
            onPress={handleSubmit(onSubmit)}
          />

          <Button
            label="Criar conta"
            variant="outline"
            rounded="rounded-full"
            height="h-14"
            textSize="text-lg"
            onPress={() => router.push("/(auth)/register")}
          />
        </View>
      </View>
    </Screen>
  );
}

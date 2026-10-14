import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Bike } from "lucide-react-native";
import { Screen } from "../src/ui/Screen";
import { Input } from "../src/ui/Input";
import { Button } from "../src/ui/Button";
import { IconBadge } from "../src/ui/IconBadge";
import { ChoiceChips } from "../src/ui/ChoiceChips";
import { CityRadioList } from "../src/ui/CityRadioList";
import { signupDriver } from "../src/api/driver";
import { ApiError } from "../src/api/errors";
import { useAuth } from "../src/auth/AuthContext";
import { useDriver } from "../src/driver/DriverContext";
import { ALLOWED_CITIES, type AllowedCity } from "../src/@types/auth";
import { driverSignupSchema } from "../src/lib/validation";
import { formatCpf, formatPhone } from "../src/lib/masks";

const VEHICLES = ["Moto", "Bicicleta", "Carro"] as const;
type Vehicle = (typeof VEHICLES)[number];

type FieldErrors = Partial<Record<"fullName" | "cpf" | "phone" | "city", string>>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-4">
      <Text className="text-sm font-extrabold uppercase tracking-wider text-primary">{title}</Text>
      {children}
    </View>
  );
}

export default function DriverSignupScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { hasSignedUp, refreshDriver } = useDriver();

  const userCity = user?.defaultAddress?.city;
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState(formatPhone(user?.phone ?? ""));
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [city, setCity] = useState<AllowedCity | null>(
    (ALLOWED_CITIES as readonly string[]).includes(userCity ?? "") ? (userCity as AllowedCity) : null
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  // Quem já tem cadastro não pode ficar neste formulário.
  if (hasSignedUp && !submitting) return <Redirect href="/" />;

  const needsPlate = vehicle === "Moto" || vehicle === "Carro";

  async function onSubmit() {
    setFormError(null);
    setErrors({});

    const parsed = driverSignupSchema.safeParse({
      fullName,
      cpf,
      phone,
      vehicleType: vehicle ?? undefined,
      vehiclePlate: needsPlate ? vehiclePlate.trim().toUpperCase() || undefined : undefined,
      city,
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key in { fullName: 1, cpf: 1, phone: 1, city: 1 } && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      await signupDriver({
        tx_full_name: parsed.data.fullName.trim(),
        tx_cpf: parsed.data.cpf,
        tx_phone: parsed.data.phone.trim(),
        tx_vehicle_type: parsed.data.vehicleType,
        tx_vehicle_plate: parsed.data.vehiclePlate,
        tx_city: parsed.data.city,
      });
      await refreshDriver();
      router.replace("/pending-approval");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        if (/CPF/i.test(err.message)) {
          setErrors({ cpf: "Este CPF já está cadastrado em outra conta de entregador." });
        } else {
          // Já existe cadastro para este login: o app só não sabia. Sincroniza e segue.
          await refreshDriver();
          router.replace("/");
        }
      } else {
        setFormError(err instanceof Error ? err.message : "Não foi possível enviar seu cadastro.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-6 gap-4">
            <IconBadge icon={Bike} />
            <View className="gap-2">
              <Text className="text-3xl font-extrabold leading-tight text-foreground">
                Falta pouco para você rodar
              </Text>
              <Text className="text-base text-muted-foreground">
                Sua conta {user?.email ? `(${user.email}) ` : ""}já foi criada. Agora conte um
                pouco sobre você para liberarmos as entregas.
              </Text>
            </View>
          </View>

          <View className="mt-8 gap-8">
            <Section title="Seus dados">
              <Input
                label="Nome completo"
                value={fullName}
                onChangeText={setFullName}
                autoComplete="name"
                rounded="rounded-full"
                height="h-14"
                error={errors.fullName}
              />
              <Input
                label="CPF"
                placeholder="000.000.000-00"
                value={cpf}
                onChangeText={(v) => setCpf(formatCpf(v))}
                keyboardType="number-pad"
                maxLength={14}
                rounded="rounded-full"
                height="h-14"
                error={errors.cpf}
              />
              <Input
                label="Telefone"
                placeholder="(98) 99999-9999"
                value={phone}
                onChangeText={(v) => setPhone(formatPhone(v))}
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={15}
                rounded="rounded-full"
                height="h-14"
                error={errors.phone}
              />
            </Section>

            <Section title="Seu veículo (opcional)">
              <ChoiceChips options={VEHICLES} value={vehicle} onChange={setVehicle} />
              {needsPlate ? (
                <Input
                  label="Placa"
                  placeholder="ABC1D23"
                  value={vehiclePlate}
                  onChangeText={(v) => setVehiclePlate(v.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={8}
                  rounded="rounded-full"
                  height="h-14"
                />
              ) : null}
            </Section>

            <Section title="Onde você vai rodar">
              <CityRadioList options={ALLOWED_CITIES} value={city} onChange={setCity} />
              {errors.city ? <Text className="text-xs text-destructive">{errors.city}</Text> : null}
            </Section>
          </View>

          {formError ? (
            <Text className="mt-6 text-sm text-destructive">{formError}</Text>
          ) : null}

          <View className="mt-8 gap-3">
            <Button
              label="Enviar cadastro"
              loading={submitting}
              rounded="rounded-full"
              height="h-14"
              textSize="text-lg"
              onPress={() => void onSubmit()}
            />
            <Button
              label="Entrar com outra conta"
              variant="ghost"
              disabled={submitting}
              rounded="rounded-full"
              height="h-12"
              onPress={() => void logout()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

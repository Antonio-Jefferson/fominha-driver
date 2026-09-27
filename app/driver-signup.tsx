import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/ui/Screen";
import { Input } from "../src/ui/Input";
import { Button } from "../src/ui/Button";
import { CityRadioList } from "../src/ui/CityRadioList";
import { signupDriver } from "../src/api/driver";
import { useDriver } from "../src/driver/DriverContext";
import { ALLOWED_CITIES, type AllowedCity } from "../src/@types/auth";
import { driverSignupSchema } from "../src/lib/validation";

export default function DriverSignupScreen() {
  const router = useRouter();
  const { refreshDriver } = useDriver();

  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [city, setCity] = useState<AllowedCity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);

    const parsed = driverSignupSchema.safeParse({
      fullName,
      cpf,
      phone,
      vehicleType: vehicleType.trim() || undefined,
      vehiclePlate: vehiclePlate.trim() || undefined,
      city,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
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
      setError(err instanceof Error ? err.message : "Não foi possível enviar seu cadastro.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="pb-10" keyboardShouldPersistTaps="handled">
        <View className="mt-6 gap-2">
          <Text className="text-3xl font-extrabold text-foreground">
            Vamos te cadastrar como entregador
          </Text>
          <Text className="text-base text-muted-foreground">
            Precisamos de mais alguns dados antes de liberar as entregas.
          </Text>
        </View>

        <View className="mt-8 gap-4">
          <Input
            label="Nome completo"
            value={fullName}
            onChangeText={setFullName}
            autoComplete="name"
            rounded="rounded-full"
            height="h-14"
          />
          <Input
            label="CPF"
            value={cpf}
            onChangeText={setCpf}
            keyboardType="number-pad"
            rounded="rounded-full"
            height="h-14"
          />
          <Input
            label="Telefone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            rounded="rounded-full"
            height="h-14"
          />
          <Input
            label="Tipo de veículo (opcional)"
            placeholder="Moto, bicicleta, carro..."
            value={vehicleType}
            onChangeText={setVehicleType}
            rounded="rounded-full"
            height="h-14"
          />
          <Input
            label="Placa (opcional)"
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
            autoCapitalize="characters"
            rounded="rounded-full"
            height="h-14"
          />

          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Cidade de atuação
            </Text>
            <CityRadioList options={ALLOWED_CITIES} value={city} onChange={setCity} />
          </View>

          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

          <Button
            label="Enviar cadastro"
            loading={submitting}
            rounded="rounded-full"
            height="h-14"
            textSize="text-lg"
            onPress={() => void onSubmit()}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

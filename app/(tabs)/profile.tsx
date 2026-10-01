import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Screen } from "../../src/ui/Screen";
import { Input } from "../../src/ui/Input";
import { Button } from "../../src/ui/Button";
import { useAuth } from "../../src/auth/AuthContext";
import { useDriver } from "../../src/driver/DriverContext";
import { updateDriverMe } from "../../src/api/driver";

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { driver, refreshDriver } = useDriver();

  const [fullName, setFullName] = useState(driver?.tx_full_name ?? "");
  const [phone, setPhone] = useState(driver?.tx_phone ?? "");
  const [vehicleType, setVehicleType] = useState(driver?.tx_vehicle_type ?? "");
  const [vehiclePlate, setVehiclePlate] = useState(driver?.tx_vehicle_plate ?? "");
  const [pixKey, setPixKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await updateDriverMe({
        tx_full_name: fullName.trim() || undefined,
        tx_phone: phone.trim() || undefined,
        tx_vehicle_type: vehicleType.trim() || undefined,
        tx_vehicle_plate: vehiclePlate.trim() || undefined,
        tx_pix_key: pixKey.trim() || undefined,
      });
      await refreshDriver();
      setPixKey("");
      setSuccess("Dados atualizados com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!driver) return null;

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-4 pb-10">
        <View className="mt-4 gap-1">
          <Text className="text-2xl font-extrabold text-foreground">Meu perfil</Text>
          <Text className="text-sm text-muted-foreground">Cidade de atuação: {driver.tx_city}</Text>
        </View>

        <Input label="Nome completo" value={fullName} onChangeText={setFullName} />
        <Input label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Tipo de veículo" value={vehicleType} onChangeText={setVehicleType} />
        <Input label="Placa" value={vehiclePlate} onChangeText={setVehiclePlate} autoCapitalize="characters" />
        <Input
          label="Chave PIX (deixe em branco para manter a atual)"
          value={pixKey}
          onChangeText={setPixKey}
          placeholder="CPF, e-mail, telefone ou chave aleatória"
        />

        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
        {success ? <Text className="text-sm text-foreground">{success}</Text> : null}

        <Button label="Salvar alterações" loading={submitting} onPress={() => void handleSave()} />
        <Button label="Sair" variant="ghost" onPress={() => void logout()} />
      </ScrollView>
    </Screen>
  );
}

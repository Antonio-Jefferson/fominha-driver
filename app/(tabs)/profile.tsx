import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { FileText, Headphones, Trash2 } from "lucide-react-native";
import { Screen } from "../../src/ui/Screen";
import { Input } from "../../src/ui/Input";
import { Button } from "../../src/ui/Button";
import { useAuth } from "../../src/auth/AuthContext";
import { useDriver } from "../../src/driver/DriverContext";
import { updateDriverMe } from "../../src/api/driver";
import { openSupport } from "../../src/lib/support";
import { KeyboardAwareScroll } from "../../src/ui/KeyboardAwareScroll";

export default function ProfileScreen() {
  const router = useRouter();
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
      <KeyboardAwareScroll
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 pb-10"
      >
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
        <View className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <Pressable
            accessibilityRole="button"
            onPress={() => void openSupport()}
            className="flex-row items-center gap-3 border-b border-border px-4 py-4 active:opacity-70"
          >
            <Headphones color="#6B7280" size={20} />
            <Text className="flex-1 text-base font-medium text-foreground">Ajuda e suporte</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/legal")}
            className="flex-row items-center gap-3 px-4 py-4 active:opacity-70"
          >
            <FileText color="#6B7280" size={20} />
            <Text className="flex-1 text-base font-medium text-foreground">Termos e privacidade</Text>
          </Pressable>
        </View>

        <Button label="Sair" variant="ghost" onPress={() => void logout()} />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/delete-account")}
          className="flex-row items-center justify-center gap-2 py-3 active:opacity-70"
        >
          <Trash2 color="#9CA3AF" size={16} />
          <Text className="text-sm font-medium text-muted-foreground">Excluir minha conta</Text>
        </Pressable>
      </KeyboardAwareScroll>
    </Screen>
  );
}

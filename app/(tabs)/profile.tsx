import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Bike, FileText, Headphones, LogOut, Trash2 } from "lucide-react-native";
import { Screen } from "../../src/ui/Screen";
import { Input } from "../../src/ui/Input";
import { Button } from "../../src/ui/Button";
import { useAuth } from "../../src/auth/AuthContext";
import { useDriver } from "../../src/driver/DriverContext";
import { updateDriverMe } from "../../src/api/driver";
import { openSupport } from "../../src/lib/support";
import { KeyboardAwareScroll } from "../../src/ui/KeyboardAwareScroll";
import { Avatar } from "../../src/ui/Avatar";
import { ListGroup, ListRow } from "../../src/ui/ListGroup";
import { usePalette } from "../../src/ui/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { driver, refreshDriver } = useDriver();
  const p = usePalette();

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
        contentContainerClassName="gap-5 pb-10 pt-2"
      >
        <View className="flex-row items-center gap-4">
          <Avatar name={driver.tx_full_name} size={64} />
          <View className="flex-1 gap-1.5">
            <Text className="font-poppins-bold text-[22px] leading-7 text-foreground">
              {driver.tx_full_name}
            </Text>
            <Text className="text-sm text-muted-foreground">Entregador em {driver.tx_city}</Text>
            {driver.tx_vehicle_type ? (
              <View className="flex-row items-center gap-1.5 self-start rounded-full bg-muted px-2.5 py-1.5">
                <Bike size={16} color={p.primaryText} />
                <Text className="text-[13px] font-semibold text-foreground">
                  {driver.tx_vehicle_type}
                  {driver.tx_vehicle_plate ? ` · ${driver.tx_vehicle_plate}` : ""}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="gap-4">
          <Text className="font-poppins-bold text-lg text-foreground">Seus dados</Text>
          <Input label="Nome completo" value={fullName} onChangeText={setFullName} />
          <Input label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Tipo de veículo" value={vehicleType} onChangeText={setVehicleType} />
          <Input
            label="Placa"
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
            autoCapitalize="characters"
          />
          <Input
            label="Chave PIX (deixe em branco para manter a atual)"
            value={pixKey}
            onChangeText={setPixKey}
            placeholder="CPF, e-mail, telefone ou chave aleatória"
          />
        </View>

        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
        {success ? <Text className="text-sm font-semibold text-money">{success}</Text> : null}

        <Button label="Salvar alterações" loading={submitting} onPress={() => void handleSave()} />

        <ListGroup>
          <ListRow icon={Headphones} label="Ajuda e suporte" onPress={() => void openSupport()} />
          <ListRow
            icon={FileText}
            label="Termos e privacidade"
            onPress={() => router.push("/legal")}
          />
          <ListRow
            icon={LogOut}
            label="Sair da conta"
            chevron={false}
            last
            onPress={() => void logout()}
          />
        </ListGroup>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/delete-account")}
          className="min-h-11 flex-row items-center justify-center gap-2 active:opacity-70"
        >
          <Trash2 color={p.mutedForeground} size={16} />
          <Text className="text-sm font-medium text-muted-foreground">Excluir minha conta</Text>
        </Pressable>
      </KeyboardAwareScroll>
    </Screen>
  );
}

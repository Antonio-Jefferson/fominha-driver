import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { ChevronDown, X } from "lucide-react-native";
import { BR_STATE_NAMES, cityKey, listCities } from "../api/ibge";

const STATES = Object.keys(BR_STATE_NAMES).sort((a, b) =>
  BR_STATE_NAMES[a].localeCompare(BR_STATE_NAMES[b], "pt-BR")
);

type Value = { state: string; city: string };

/**
 * UF numa lista e, com ela, a cidade numa lista do IBGE com busca. Evita
 * cidade digitada errada. Se o IBGE não responder, deixa digitar a cidade
 * para nunca travar o cadastro.
 */
export function CityStatePicker({
  value,
  onChange,
  error,
}: {
  value: Value;
  onChange: (value: Value) => void;
  error?: string;
}) {
  const [open, setOpen] = useState<"state" | "city" | null>(null);
  const [cities, setCities] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!value.state) return;
    let alive = true;
    setLoading(true);
    setFailed(false);
    setCities(null);
    listCities(value.state)
      .then((list) => alive && setCities(list))
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [value.state]);

  const filtered = useMemo(() => {
    const q = cityKey(query);
    if (!cities) return [];
    return q ? cities.filter((c) => cityKey(c).includes(q)) : cities;
  }, [cities, query]);

  function retry() {
    const uf = value.state;
    setLoading(true);
    setFailed(false);
    listCities(uf)
      .then(setCities)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }

  function close() {
    setOpen(null);
    setQuery("");
    setManual("");
  }

  return (
    <View className="gap-2">
      <View className="flex-row gap-3">
        <View className="w-28 gap-1.5">
          <Text className="text-sm font-medium text-muted-foreground">Estado</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Escolher estado"
            onPress={() => setOpen("state")}
            className="h-14 flex-row items-center justify-between rounded-full border-2 border-border bg-card px-4"
          >
            <Text className={value.state ? "text-[17px] text-foreground" : "text-[17px] text-muted-foreground"}>
              {value.state || "UF"}
            </Text>
            <ChevronDown size={18} color="#6B7280" />
          </Pressable>
        </View>
        <View className="flex-1 gap-1.5">
          <Text className="text-sm font-medium text-muted-foreground">Cidade</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Escolher cidade"
            accessibilityState={{ disabled: !value.state }}
            disabled={!value.state}
            onPress={() => setOpen("city")}
            className={`h-14 flex-row items-center justify-between rounded-full border-2 bg-card px-4 ${
              error ? "border-destructive" : "border-border"
            } ${value.state ? "" : "opacity-60"}`}
          >
            <Text
              numberOfLines={1}
              className={`flex-1 text-[17px] ${value.city ? "text-foreground" : "text-muted-foreground"}`}
            >
              {value.city || (value.state ? "Escolha a cidade" : "Escolha o estado antes")}
            </Text>
            <ChevronDown size={18} color="#6B7280" />
          </Pressable>
        </View>
      </View>
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}

      <Modal visible={open !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <View className="flex-1 bg-background px-5 pt-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">
              {open === "state" ? "Escolha o estado" : `Cidades de ${BR_STATE_NAMES[value.state] ?? ""}`}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={close} hitSlop={12}>
              <X size={24} color="#6B7280" />
            </Pressable>
          </View>

          {open === "state" ? (
            <FlatList
              data={STATES}
              keyExtractor={(uf) => uf}
              initialNumToRender={STATES.length}
              renderItem={({ item: uf }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${BR_STATE_NAMES[uf]} (${uf})`}
                  onPress={() => {
                    onChange({ state: uf, city: uf === value.state ? value.city : "" });
                    close();
                  }}
                  className={`flex-row items-center justify-between border-b border-border py-4 ${
                    uf === value.state ? "bg-muted" : ""
                  }`}
                >
                  <Text className="text-base text-foreground">{BR_STATE_NAMES[uf]}</Text>
                  <Text className="text-base font-semibold text-muted-foreground">{uf}</Text>
                </Pressable>
              )}
            />
          ) : null}

          {open === "city" ? (
            <View className="flex-1 gap-3">
              {loading ? (
                <View className="items-center py-10">
                  <ActivityIndicator />
                  <Text className="mt-3 text-sm text-muted-foreground">Carregando as cidades…</Text>
                </View>
              ) : failed ? (
                <View className="gap-3 py-4">
                  <Text className="text-base text-foreground">
                    Não deu para carregar a lista de cidades agora.
                  </Text>
                  <Pressable accessibilityRole="button" onPress={retry} className="h-12 items-center justify-center rounded-full bg-primary">
                    <Text className="font-semibold text-primary-foreground">Tentar de novo</Text>
                  </Pressable>
                  <Text className="mt-2 text-sm text-muted-foreground">Ou digite o nome da sua cidade:</Text>
                  <TextInput
                    accessibilityLabel="Digitar cidade"
                    value={manual}
                    onChangeText={setManual}
                    placeholder="Nome da cidade"
                    className="h-14 rounded-full border-2 border-border bg-card px-4 text-[17px] text-foreground"
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={manual.trim().length < 2}
                    onPress={() => {
                      onChange({ state: value.state, city: manual.trim() });
                      close();
                    }}
                    className={`h-12 items-center justify-center rounded-full border-2 border-border ${
                      manual.trim().length < 2 ? "opacity-50" : ""
                    }`}
                  >
                    <Text className="font-semibold text-foreground">Usar esta cidade</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <TextInput
                    accessibilityLabel="Buscar cidade"
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Buscar cidade"
                    autoCorrect={false}
                    className="h-12 rounded-full border-2 border-border bg-card px-4 text-base text-foreground"
                  />
                  <FlatList
                    data={filtered}
                    keyExtractor={(c) => c}
                    keyboardShouldPersistTaps="handled"
                    initialNumToRender={20}
                    ListEmptyComponent={
                      <Text className="py-6 text-center text-sm text-muted-foreground">Nenhuma cidade com esse nome.</Text>
                    }
                    renderItem={({ item: c }) => (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={c}
                        onPress={() => {
                          onChange({ state: value.state, city: c });
                          close();
                        }}
                        className={`border-b border-border py-4 ${c === value.city ? "bg-muted" : ""}`}
                      >
                        <Text className="text-base text-foreground">{c}</Text>
                      </Pressable>
                    )}
                  />
                </>
              )}
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

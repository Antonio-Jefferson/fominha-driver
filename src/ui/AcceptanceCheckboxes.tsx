import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { Check } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { listLegalDocuments, type PendingAcceptance } from "../api/legal";
import { qk } from "../lib/query-keys";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

interface Props {
  audience?: "CUSTOMER" | "ESTABLISHMENT";
  value: string[];
  onChange: (slugs: string[]) => void;
  error?: string;
  /**
   * Lista já carregada pra renderizar no lugar do fetch interno (ex.:
   * pendências de reaceite vindas de `getPendingAcceptances`, que tem um
   * formato diferente de `LegalDocumentSummary` mas carrega os mesmos
   * `slug`/`title` que esse componente realmente usa pra desenhar a lista).
   * Quando informada, `listLegalDocuments`/`audience` são ignorados.
   */
  docs?: Pick<PendingAcceptance, "slug" | "title">[];
}

export function AcceptanceCheckboxes({
  audience = "CUSTOMER",
  value,
  onChange,
  error,
  docs: docsProp,
}: Props) {
  const {
    data: fetchedDocs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: qk.legalDocuments(audience),
    queryFn: () => listLegalDocuments(audience),
    staleTime: 1000 * 60 * 60,
    enabled: docsProp === undefined,
  });

  const docs = docsProp ?? fetchedDocs;

  function toggle(slug: string) {
    onChange(
      value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug]
    );
  }

  // Sem isso o usuário chega no passo 3, preenche tudo, esbarra no
  // `acceptedTerms.min(1)` e não vê nenhum checkbox pra marcar — sem
  // devtools no app pra explicar o motivo. Mostra loading/retry como o
  // resto do app faz (ex.: app/(tabs)/home.tsx). Só se aplica ao fetch
  // interno — quando `docs` vem pronto por prop não há o que carregar.
  if (docsProp === undefined && isLoading) return <LoadingSpinner />;

  if (docsProp === undefined && isError) {
    return (
      <EmptyState
        title="Não foi possível carregar os termos"
        description="Verifique sua conexão e tente de novo."
        action={{ label: "Tentar de novo", onPress: () => void refetch() }}
      />
    );
  }

  return (
    <View className="gap-3">
      {docs.map((doc) => {
        const checked = value.includes(doc.slug);
        return (
          <View key={doc.slug} className="flex-row items-start gap-3">
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={`Li e concordo com ${doc.title}`}
              onPress={() => toggle(doc.slug)}
              className={`h-6 w-6 items-center justify-center rounded border ${
                checked ? "border-primary bg-primary" : "border-border"
              }`}
            >
              {checked && <Check size={16} color="#fff" />}
            </Pressable>
            <Text className="flex-1 text-sm text-muted-foreground">
              Li e concordo com{" "}
              <Link href={`/legal/${doc.slug}`} className="font-medium text-primary">
                {doc.title}
              </Link>
            </Text>
          </View>
        );
      })}
      {error ? (
        <Text accessibilityRole="alert" className="text-xs text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

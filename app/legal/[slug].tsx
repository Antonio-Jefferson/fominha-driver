import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import Markdown from "react-native-markdown-display";
import { Screen } from "../../src/ui/Screen";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";
import { EmptyState } from "../../src/ui/EmptyState";
import { getLegalDocument } from "../../src/api/legal";
import { qk } from "../../src/lib/query-keys";

export default function LegalDocumentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: qk.legalDocument(slug),
    queryFn: () => getLegalDocument(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 60,
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: data?.title ?? "Documento" }} />
      {isLoading ? <LoadingSpinner /> : null}
      {isError ? (
        <EmptyState
          title="Não foi possível carregar o documento"
          description="Verifique sua conexão e tente de novo."
        />
      ) : null}
      {data ? (
        <ScrollView contentContainerClassName="pb-10">
          <Text className="mb-4 text-xs text-muted-foreground">
            Versão {data.version} · vigente desde{" "}
            {new Date(data.effectiveAt).toLocaleDateString("pt-BR")}
          </Text>
          <Markdown>{data.bodyMarkdown}</Markdown>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

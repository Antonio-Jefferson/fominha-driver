import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText } from "lucide-react-native";
import { Screen } from "../../src/ui/Screen";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";
import { EmptyState } from "../../src/ui/EmptyState";
import { listDriverLegalDocuments } from "../../src/api/legal";

/** Termos de uso, política de privacidade e demais documentos vigentes. */
export default function LegalIndexScreen() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["legal", "driver-documents"],
    queryFn: listDriverLegalDocuments,
  });

  if (isLoading) return <LoadingSpinner />;

  if (isError || !data?.length) {
    return (
      <Screen>
        <EmptyState
          title="Documentos indisponíveis"
          description="Não foi possível carregar agora. Tente de novo em instantes."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="pt-4 pb-8">
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          {data.map((doc, index) => (
            <Pressable
              key={doc.slug}
              accessibilityRole="button"
              onPress={() => router.push(`/legal/${doc.slug}`)}
              className={`flex-row items-center gap-3 px-4 py-4 active:opacity-70 ${
                index === data.length - 1 ? "" : "border-b border-border"
              }`}
            >
              <FileText color="#6B7280" size={20} />
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">
                  {doc.title}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Versão {doc.version}
                </Text>
              </View>
              <ChevronRight color="#C4C4C4" size={18} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

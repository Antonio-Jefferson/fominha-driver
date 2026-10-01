import { useEffect } from "react";
import { FlatList, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "../../src/ui/Screen";
import { EmptyState } from "../../src/ui/EmptyState";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";
import { listNotifications, markAllRead } from "../../src/api/notifications";

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
  });

  useEffect(() => {
    if (data && data.unread > 0) {
      void markAllRead().then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }));
    }
  }, [data, queryClient]);

  if (isLoading) return <LoadingSpinner />;

  if (!data || data.notifications.length === 0) {
    return (
      <Screen>
        <EmptyState title="Nenhuma notificação" description="Avisos sobre ofertas e entregas aparecem aqui." />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={data.notifications}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pt-4"
        renderItem={({ item }) => (
          <View className="mb-3 gap-1 rounded border border-border bg-card p-4">
            <Text className="text-base font-semibold text-foreground">{item.title}</Text>
            <Text className="text-sm text-muted-foreground">{item.body}</Text>
            <Text className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleString("pt-BR")}
            </Text>
          </View>
        )}
      />
    </Screen>
  );
}

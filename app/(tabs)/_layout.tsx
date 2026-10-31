import type { ComponentType } from "react";
import { View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Bell, Home, User, Wallet } from "lucide-react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { useDriver } from "../../src/driver/DriverContext";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";
import { DriverLoadError } from "../../src/ui/DriverLoadError";
import { usePalette } from "../../src/ui/theme";

type IconComponent = ComponentType<{ size?: number; color?: string }>;

function TabIcon({
  icon: Icon,
  focused,
  size,
}: {
  icon: IconComponent;
  focused: boolean;
  size: number;
}) {
  const p = usePalette();
  return (
    <View
      className={`h-8 w-14 items-center justify-center rounded-full ${focused ? "bg-primary" : ""}`}
    >
      <Icon size={size} color={focused ? p.primaryForeground : p.mutedForeground} />
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { driver, hasSignedUp, loadError, isLoading: driverLoading } = useDriver();
  const p = usePalette();

  if (authLoading || driverLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (loadError) return <DriverLoadError />;
  if (!hasSignedUp) return <Redirect href="/driver-signup" />;
  if (driver?.enum_status !== "ACTIVE") return <Redirect href="/pending-approval" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.foreground,
        tabBarInactiveTintColor: p.mutedForeground,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarStyle: { backgroundColor: p.card, borderTopColor: p.border },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Início",
          tabBarIcon: ({ focused, size }) => <TabIcon icon={Home} focused={focused} size={size} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Carteira",
          tabBarIcon: ({ focused, size }) => <TabIcon icon={Wallet} focused={focused} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Avisos",
          tabBarIcon: ({ focused, size }) => <TabIcon icon={Bell} focused={focused} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused, size }) => <TabIcon icon={User} focused={focused} size={size} />,
        }}
      />
    </Tabs>
  );
}

import { Redirect, Tabs } from "expo-router";
import { Bell, Home, User, Wallet } from "lucide-react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { useDriver } from "../../src/driver/DriverContext";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";

export default function TabsLayout() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { driver, hasSignedUp, isLoading: driverLoading } = useDriver();

  if (authLoading || driverLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (!hasSignedUp) return <Redirect href="/driver-signup" />;
  if (driver?.enum_status !== "ACTIVE") return <Redirect href="/pending-approval" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#F59E0B",
        tabBarInactiveTintColor: "#6B7280",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Carteira",
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Avisos",
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

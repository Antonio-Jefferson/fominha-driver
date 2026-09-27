import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/auth/AuthContext";
import { LoadingSpinner } from "../../src/ui/LoadingSpinner";
import { AuthHeader } from "../../src/ui/AuthHeader";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (isAuthenticated) return <Redirect href="/(tabs)/home" />;

  return (
    <Stack screenOptions={{ header: (props) => <AuthHeader {...props} /> }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Criar conta" }} />
      <Stack.Screen
        name="forgot-password"
        options={{ title: "Recuperar senha" }}
      />
    </Stack>
  );
}

import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Toast from "react-native-toast-message";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "../src/auth/AuthContext";
import { DriverProvider } from "../src/driver/DriverContext";
import { queryClient } from "../src/lib/query-client";
import { usePushHandlers } from "../src/push/usePushHandlers";

SplashScreen.preventAutoHideAsync();

function PushBridge() {
  usePushHandlers();
  return null;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DriverProvider>
              <StatusBar style="dark" />
              <PushBridge />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="driver-signup" options={{ gestureEnabled: false }} />
                <Stack.Screen name="pending-approval" />
                <Stack.Screen name="delivery/active" />
                <Stack.Screen name="withdrawals" options={{ headerShown: true, title: "Histórico de saques" }} />
                <Stack.Screen name="legal/index" options={{ headerShown: true, title: "Termos e privacidade" }} />
                <Stack.Screen name="legal/[slug]" options={{ headerShown: true, title: "Documento" }} />
                <Stack.Screen name="delete-account" options={{ headerShown: true, title: "Excluir conta" }} />
              </Stack>
              <Toast />
            </DriverProvider>
          </AuthProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

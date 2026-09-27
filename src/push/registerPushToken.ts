import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "../api/client";

/**
 * Registra o dispositivo para push via Expo Push Service e devolve o Expo push
 * token. Nunca lança: qualquer falha (sem permissão, emulador, sem projectId,
 * backend recusou) resolve `null` e o caller simplesmente não guarda token.
 */
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permission.granted) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  let token: string;
  try {
    if (!projectId) return null;
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    token = result.data;
  } catch {
    return null;
  }

  try {
    await api.post("users/me/devices", {
      token,
      platform: Platform.OS === "ios" ? "ios" : "android",
    });
  } catch (error) {
    console.warn("push: backend recusou o registro do device", error);
    return null;
  }

  return token;
}

/** Remove o device no backend. Nunca lança — só loga. */
export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await api.delete(`users/me/devices/${encodeURIComponent(token)}`);
  } catch (error) {
    console.warn("push: falha ao remover o device", error);
  }
}

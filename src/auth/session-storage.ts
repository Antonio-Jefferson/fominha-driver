import * as SecureStore from "expo-secure-store";
import type { Session } from "../@types/auth";

const SESSION_KEY = "fominha_session";

/** Lê a sessão salva. Devolve null se não houver ou se estiver corrompida. */
export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  // O envio da posição roda com o aparelho bloqueado durante a entrega. No iOS,
  // o padrão (WHEN_UNLOCKED) não deixaria ler o token nesse momento.
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

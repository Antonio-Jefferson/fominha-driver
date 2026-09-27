import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser, Session } from "../@types/auth";
import { clearSession, loadSession, saveSession } from "./session-storage";
import { getMe, login as loginRequest } from "../api/auth";
import { setOnUnauthorized } from "../api/client";
import { registerForPush, unregisterPushToken } from "../push/registerPushToken";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pushTokenRef = useRef<string | null>(null);

  // Fire-and-forget: registrar push nunca bloqueia nem derruba o fluxo de auth.
  const syncPushToken = useCallback(() => {
    void registerForPush()
      .then((t) => {
        pushTokenRef.current = t;
      })
      .catch(() => {
        // registerForPush não deve lançar; se lançar, push simplesmente não sobe.
      });
  }, []);

  const forgetUser = useCallback(async () => {
    const token = pushTokenRef.current;
    pushTokenRef.current = null;
    if (token) void unregisterPushToken(token);
    await clearSession();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const session = await loadSession();
    if (!session?.access_token) {
      setUser(null);
      return;
    }
    try {
      setUser(await getMe());
      syncPushToken();
    } catch {
      await forgetUser();
    }
  }, [forgetUser, syncPushToken]);

  useEffect(() => {
    // O client avisa aqui quando o refresh falha e a sessão morre de vez.
    setOnUnauthorized(() => {
      setUser(null);
    });
    return () => setOnUnauthorized(null);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await refreshUser();
      if (active) setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const session: Session = await loginRequest(input);
      await saveSession(session);
      // A resposta do login vem com o usuário incompleto (sem defaultAddress);
      // o /auth/me é a fonte completa. Cai no usuário do login se ele falhar.
      try {
        setUser(await getMe());
      } catch {
        if (!session.user) throw new Error("Não foi possível carregar o perfil");
        setUser(session.user);
      }
      syncPushToken();
    },
    [syncPushToken]
  );

  const logout = useCallback(async () => {
    await forgetUser();
  }, [forgetUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}

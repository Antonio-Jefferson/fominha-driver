import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthContext";
import { getDriverMe } from "../api/driver";
import { ApiError } from "../api/errors";
import type { DriverProfile } from "../@types/driver";

type DriverContextValue = {
  driver: DriverProfile | null;
  isLoading: boolean;
  /** true assim que existe um cadastro de entregador (mesmo pendente/suspenso). */
  hasSignedUp: boolean;
  /**
   * true quando não deu pra saber se o entregador tem cadastro (rede, timeout,
   * 5xx...). Nesse caso NÃO se pode mandar o usuário pro formulário de cadastro:
   * ele pode já ser entregador e tomaria "você já tem cadastro" em loop.
   */
  loadError: boolean;
  refreshDriver: () => Promise<void>;
};

const DriverContext = createContext<DriverContextValue | null>(null);

export function DriverProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id ?? null;
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSignedUp, setHasSignedUp] = useState(false);
  const [loadError, setLoadError] = useState(false);
  // Usuário para o qual `driver`/`hasSignedUp` já foram resolvidos. Sem isso,
  // no login há uma renderização com `isAuthenticated=true` e `isLoading=false`
  // (o efeito de busca só roda depois dela): as telas leem "sem cadastro" e
  // mandam o entregador que já é cadastrado para /driver-signup.
  const [resolvedFor, setResolvedFor] = useState<string | null>(null);

  const refreshDriver = useCallback(async () => {
    if (!isAuthenticated) {
      setDriver(null);
      setHasSignedUp(false);
      setLoadError(false);
      setResolvedFor(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const profile = await getDriverMe();
      setDriver(profile);
      setHasSignedUp(true);
      setLoadError(false);
    } catch (err) {
      setDriver(null);
      setHasSignedUp(false);
      // Só o 404 significa "ainda não é entregador". Qualquer outra falha é
      // incerteza: as telas mostram "tentar de novo" em vez do cadastro.
      setLoadError(!(err instanceof ApiError && err.status === 404));
    } finally {
      setResolvedFor(userId);
      setIsLoading(false);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    void refreshDriver();
  }, [refreshDriver]);

  return (
    <DriverContext.Provider
      value={{
        driver,
        isLoading: isLoading || (isAuthenticated && resolvedFor !== userId),
        hasSignedUp,
        loadError,
        refreshDriver,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver(): DriverContextValue {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error("useDriver precisa estar dentro de DriverProvider");
  return ctx;
}

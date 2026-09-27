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
import type { DriverProfile } from "../@types/driver";

type DriverContextValue = {
  driver: DriverProfile | null;
  isLoading: boolean;
  /** true assim que existe um cadastro de entregador (mesmo pendente/suspenso). */
  hasSignedUp: boolean;
  refreshDriver: () => Promise<void>;
};

const DriverContext = createContext<DriverContextValue | null>(null);

export function DriverProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSignedUp, setHasSignedUp] = useState(false);

  const refreshDriver = useCallback(async () => {
    if (!isAuthenticated) {
      setDriver(null);
      setHasSignedUp(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const profile = await getDriverMe();
      setDriver(profile);
      setHasSignedUp(true);
    } catch {
      // 404 (sem cadastro) e qualquer outro erro caem no mesmo estado "sem
      // cadastro" pra não travar a navegação; telas que dependem de dados
      // de entregador tratam o erro delas.
      setDriver(null);
      setHasSignedUp(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshDriver();
  }, [refreshDriver]);

  return (
    <DriverContext.Provider value={{ driver, isLoading, hasSignedUp, refreshDriver }}>
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver(): DriverContextValue {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error("useDriver precisa estar dentro de DriverProvider");
  return ctx;
}

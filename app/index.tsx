import { useEffect } from "react";
import { useRouter } from "expo-router";
import { LoadingSpinner } from "../src/ui/LoadingSpinner";
import { DriverLoadError } from "../src/ui/DriverLoadError";
import { useAuth } from "../src/auth/AuthContext";
import { useDriver } from "../src/driver/DriverContext";

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { driver, hasSignedUp, loadError, isLoading: driverLoading } = useDriver();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }
    if (driverLoading || loadError) return;
    if (!hasSignedUp) {
      router.replace("/driver-signup");
      return;
    }
    if (driver?.enum_status !== "ACTIVE") {
      router.replace("/pending-approval");
      return;
    }
    router.replace("/(tabs)/home");
  }, [authLoading, isAuthenticated, driverLoading, loadError, hasSignedUp, driver, router]);

  if (isAuthenticated && !driverLoading && loadError) return <DriverLoadError />;
  return <LoadingSpinner />;
}

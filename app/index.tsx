import { useEffect } from "react";
import { useRouter } from "expo-router";
import { LoadingSpinner } from "../src/ui/LoadingSpinner";
import { useAuth } from "../src/auth/AuthContext";
import { useDriver } from "../src/driver/DriverContext";

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { driver, hasSignedUp, isLoading: driverLoading } = useDriver();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }
    if (driverLoading) return;
    if (!hasSignedUp) {
      router.replace("/driver-signup");
      return;
    }
    if (driver?.enum_status !== "ACTIVE") {
      router.replace("/pending-approval");
      return;
    }
    router.replace("/(tabs)/home");
  }, [authLoading, isAuthenticated, driverLoading, hasSignedUp, driver, router]);

  return <LoadingSpinner />;
}

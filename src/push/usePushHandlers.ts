import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

/**
 * Montado uma vez na raiz do app. Liga a apresentação em primeiro plano e
 * transforma o toque numa notificação de oferta de entrega em navegação
 * pra Home, onde a lista de ofertas ativas vive.
 */
export function usePushHandlers(): void {
  const router = useRouter();
  const coldStartHandled = useRef(false);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const openOffer = (
      response: Notifications.NotificationResponse | null | undefined
    ) => {
      const type = response?.notification.request.content.data?.type;
      if (type === "DELIVERY_OFFER") router.push("/(tabs)/home");
    };

    const sub = Notifications.addNotificationResponseReceivedListener(openOffer);

    if (!coldStartHandled.current) {
      coldStartHandled.current = true;
      void Notifications.getLastNotificationResponseAsync().then(openOffer);
    }

    return () => sub.remove();
  }, [router]);
}

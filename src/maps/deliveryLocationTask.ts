import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { updateLocation } from "../api/deliveries";

export const DELIVERY_LOCATION_TASK = "fominha-delivery-location";

type TaskData = { locations?: Location.LocationObject[] };

/** Só a posição mais recente interessa: o back guarda o último ponto, não o trajeto. */
export async function sendLatestLocation(data: TaskData | undefined): Promise<void> {
  const latest = data?.locations?.at(-1);
  if (!latest) return;
  try {
    await updateLocation(latest.coords.latitude, latest.coords.longitude);
  } catch {
    // Sem sinal agora: a próxima leitura do GPS tenta de novo.
  }
}

// Precisa ser definida ao carregar o módulo, antes de o app montar.
TaskManager.defineTask<TaskData>(DELIVERY_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  await sendLatestLocation(data);
});

/**
 * Mantém o GPS ligado com o app em segundo plano, só durante a entrega. No
 * Android usa um serviço com notificação visível, que dispensa a permissão de
 * localização "o tempo todo".
 */
export async function startDeliveryTracking(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return false;
  if (await Location.hasStartedLocationUpdatesAsync(DELIVERY_LOCATION_TASK)) return true;
  await Location.startLocationUpdatesAsync(DELIVERY_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 10_000,
    distanceInterval: 30,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Entrega em andamento",
      notificationBody: "O cliente acompanha sua posição até o fim da entrega.",
      notificationColor: "#F59E0B",
    },
  });
  return true;
}

export async function stopDeliveryTracking(): Promise<void> {
  if (await Location.hasStartedLocationUpdatesAsync(DELIVERY_LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(DELIVERY_LOCATION_TASK);
  }
}

import * as Location from "expo-location";
import { updateLocation } from "../api/deliveries";
import {
  DELIVERY_LOCATION_TASK,
  sendLatestLocation,
  startDeliveryTracking,
  stopDeliveryTracking,
} from "./deliveryLocationTask";

jest.mock("expo-task-manager", () => ({ defineTask: jest.fn() }));
jest.mock("../api/deliveries", () => ({ updateLocation: jest.fn() }));
jest.mock("expo-location", () => ({
  Accuracy: { High: 4 },
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  hasStartedLocationUpdatesAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
}));

const location = Location as jest.Mocked<typeof Location>;
const point = (latitude: number) =>
  ({ coords: { latitude, longitude: -45 } }) as Location.LocationObject;

beforeEach(() => {
  jest.clearAllMocks();
  location.requestForegroundPermissionsAsync.mockResolvedValue({ status: "granted" } as never);
  location.hasStartedLocationUpdatesAsync.mockResolvedValue(false);
});

describe("sendLatestLocation", () => {
  it("envia só a posição mais recente do lote", async () => {
    await sendLatestLocation({ locations: [point(-3.1), point(-3.2)] });
    expect(updateLocation).toHaveBeenCalledTimes(1);
    expect(updateLocation).toHaveBeenCalledWith(-3.2, -45);
  });

  it("não quebra sem sinal", async () => {
    (updateLocation as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    await expect(sendLatestLocation({ locations: [point(-3.1)] })).resolves.toBeUndefined();
  });
});

describe("startDeliveryTracking", () => {
  it("usa serviço com notificação visível e não pede a permissão de segundo plano", async () => {
    await expect(startDeliveryTracking()).resolves.toBe(true);

    const [task, options] = location.startLocationUpdatesAsync.mock.calls[0];
    expect(task).toBe(DELIVERY_LOCATION_TASK);
    expect(options?.foregroundService?.notificationTitle).toBe("Entrega em andamento");
    expect(location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it("sem permissão não liga o GPS", async () => {
    location.requestForegroundPermissionsAsync.mockResolvedValue({ status: "denied" } as never);
    await expect(startDeliveryTracking()).resolves.toBe(false);
    expect(location.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it("não liga duas vezes", async () => {
    location.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
    await startDeliveryTracking();
    expect(location.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });
});

describe("stopDeliveryTracking", () => {
  it("desliga quando estava ligado", async () => {
    location.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
    await stopDeliveryTracking();
    expect(location.stopLocationUpdatesAsync).toHaveBeenCalledWith(DELIVERY_LOCATION_TASK);
  });

  it("não faz nada quando já estava desligado", async () => {
    await stopDeliveryTracking();
    expect(location.stopLocationUpdatesAsync).not.toHaveBeenCalled();
  });
});

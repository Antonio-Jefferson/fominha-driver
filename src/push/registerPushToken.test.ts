import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { api } from "../api/client";
import { registerForPush, unregisterPushToken } from "./registerPushToken";

jest.mock("expo-device", () => ({ __esModule: true, isDevice: true }));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: "p1" } } } },
}));

jest.mock("../api/client", () => ({
  api: { post: jest.fn(), delete: jest.fn() },
}));

const mockedNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockedApi = api as jest.Mocked<typeof api>;
const mockedDevice = Device as { isDevice: boolean };

const GRANTED = { granted: true, status: "granted" } as never;
const DENIED = { granted: false, status: "denied" } as never;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "warn").mockImplementation(() => {});
  mockedDevice.isDevice = true;
  mockedNotifications.getPermissionsAsync.mockResolvedValue(GRANTED);
  mockedNotifications.requestPermissionsAsync.mockResolvedValue(GRANTED);
  mockedNotifications.getExpoPushTokenAsync.mockResolvedValue({
    data: "ExponentPushToken[x]",
    type: "expo",
  } as never);
  mockedApi.post.mockResolvedValue(undefined as never);
  mockedApi.delete.mockResolvedValue(undefined as never);
});

afterEach(() => {
  (console.warn as jest.Mock).mockRestore();
});

describe("registerForPush", () => {
  it("returns the token and registers the device when permission is granted", async () => {
    const token = await registerForPush();

    expect(token).toBe("ExponentPushToken[x]");
    expect(mockedApi.post).toHaveBeenCalledWith("users/me/devices", {
      token: "ExponentPushToken[x]",
      platform: "ios",
    });
  });

  it("returns null and never posts when permission stays denied", async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue(DENIED);
    mockedNotifications.requestPermissionsAsync.mockResolvedValue(DENIED);

    const token = await registerForPush();

    expect(token).toBeNull();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("returns null without touching Notifications on a non-device", async () => {
    mockedDevice.isDevice = false;

    const token = await registerForPush();

    expect(token).toBeNull();
    expect(mockedNotifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(mockedNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("returns null (no throw) when getExpoPushTokenAsync throws", async () => {
    mockedNotifications.getExpoPushTokenAsync.mockRejectedValue(
      new Error("no projectId")
    );

    await expect(registerForPush()).resolves.toBeNull();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});

describe("unregisterPushToken", () => {
  it("deletes the url-encoded token", async () => {
    await unregisterPushToken("ExponentPushToken[x]");

    expect(mockedApi.delete).toHaveBeenCalledWith(
      "users/me/devices/ExponentPushToken%5Bx%5D"
    );
  });
});

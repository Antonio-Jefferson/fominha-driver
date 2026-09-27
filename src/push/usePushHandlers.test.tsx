import { renderHook, waitFor } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";

import { usePushHandlers } from "./usePushHandlers";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn().mockResolvedValue(null),
}));

const mockedNotifications = Notifications as jest.Mocked<typeof Notifications>;

type ResponseListener = (response: unknown) => void;

beforeEach(() => {
  jest.clearAllMocks();
  mockedNotifications.addNotificationResponseReceivedListener.mockReturnValue({
    remove: jest.fn(),
  } as never);
  mockedNotifications.getLastNotificationResponseAsync.mockResolvedValue(
    null as never
  );
});

describe("usePushHandlers", () => {
  it("registers the foreground handler and the response listener once on mount", () => {
    renderHook(() => usePushHandlers());

    expect(mockedNotifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    expect(
      mockedNotifications.addNotificationResponseReceivedListener
    ).toHaveBeenCalledTimes(1);
  });

  it("navega pra Home quando a notificação tocada é uma oferta de entrega", () => {
    renderHook(() => usePushHandlers());

    const listener = mockedNotifications.addNotificationResponseReceivedListener
      .mock.calls[0][0] as ResponseListener;
    listener({
      notification: { request: { content: { data: { type: "DELIVERY_OFFER" } } } },
    });

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/home");
  });

  it("não navega quando a notificação não é do tipo DELIVERY_OFFER", () => {
    renderHook(() => usePushHandlers());

    const listener = mockedNotifications.addNotificationResponseReceivedListener
      .mock.calls[0][0] as ResponseListener;
    listener({ notification: { request: { content: { data: {} } } } });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("removes the subscription on unmount", () => {
    const remove = jest.fn();
    mockedNotifications.addNotificationResponseReceivedListener.mockReturnValue({
      remove,
    } as never);

    const { unmount } = renderHook(() => usePushHandlers());
    unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("navega pra Home a partir de um cold start com oferta de entrega", async () => {
    mockedNotifications.getLastNotificationResponseAsync.mockResolvedValue({
      notification: { request: { content: { data: { type: "DELIVERY_OFFER" } } } },
    } as never);

    renderHook(() => usePushHandlers());

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/(tabs)/home"));
  });
});

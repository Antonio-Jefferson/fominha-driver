import { Text, Pressable } from "react-native";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "./AuthContext";
import * as storage from "./session-storage";
import * as authApi from "../api/auth";
import * as push from "../push/registerPushToken";
import type { Session } from "../@types/auth";

jest.mock("./session-storage");
jest.mock("../api/auth");
jest.mock("../api/client", () => ({ setOnUnauthorized: jest.fn() }));
jest.mock("../push/registerPushToken", () => ({
  registerForPush: jest.fn().mockResolvedValue("ExponentPushToken[x]"),
  unregisterPushToken: jest.fn(),
}));

const mockedStorage = storage as jest.Mocked<typeof storage>;
const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedPush = push as jest.Mocked<typeof push>;

const session: Session = {
  access_token: "a",
  refresh_token: "r",
  token_type: "Bearer",
  expires_in: 3600,
  expires_at: "2026-01-01T00:00:00.000Z",
};

const user = {
  id: "1",
  full_name: "Ana",
  email: "ana@example.com",
  phone: null,
  role: "CUSTOMER",
  active: true,
};

function Probe() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  return (
    <>
      <Text testID="loading">{String(isLoading)}</Text>
      <Text testID="authed">{String(isAuthenticated)}</Text>
      <Text testID="name">{user?.full_name ?? "-"}</Text>
      <Pressable
        testID="login"
        onPress={() => login({ email: "a@b.c", password: "x" })}
      >
        <Text>login</Text>
      </Pressable>
      <Pressable testID="logout" onPress={() => logout()}>
        <Text>logout</Text>
      </Pressable>
    </>
  );
}

function renderProbe() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedStorage.saveSession.mockResolvedValue(undefined);
  mockedStorage.clearSession.mockResolvedValue(undefined);
  mockedPush.registerForPush.mockResolvedValue("ExponentPushToken[x]");
  mockedPush.unregisterPushToken.mockResolvedValue(undefined);
  mockedAuthApi.getMe.mockResolvedValue(user);
});

describe("AuthContext", () => {
  it("ends loading unauthenticated when there is no stored session", async () => {
    mockedStorage.loadSession.mockResolvedValue(null);

    renderProbe();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("authed")).toHaveTextContent("false");
    expect(mockedAuthApi.getMe).not.toHaveBeenCalled();
  });

  it("restores the user from a stored session", async () => {
    mockedStorage.loadSession.mockResolvedValue(session);
    mockedAuthApi.getMe.mockResolvedValue(user);

    renderProbe();

    await waitFor(() => expect(screen.getByTestId("authed")).toHaveTextContent("true"));
    expect(screen.getByTestId("name")).toHaveTextContent("Ana");
  });

  it("clears the session when the stored token is rejected", async () => {
    mockedStorage.loadSession.mockResolvedValue(session);
    mockedAuthApi.getMe.mockRejectedValue(new Error("401"));

    renderProbe();

    await waitFor(() => expect(mockedStorage.clearSession).toHaveBeenCalled());
    expect(screen.getByTestId("authed")).toHaveTextContent("false");
  });

  it("saves the session and sets the user on login", async () => {
    mockedStorage.loadSession.mockResolvedValue(null);
    mockedAuthApi.login.mockResolvedValue({ ...session, user });
    mockedAuthApi.getMe.mockResolvedValue(user);

    renderProbe();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    fireEvent.press(screen.getByTestId("login"));

    await waitFor(() => expect(screen.getByTestId("authed")).toHaveTextContent("true"));
    expect(mockedStorage.saveSession).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: "a" })
    );
    expect(screen.getByTestId("name")).toHaveTextContent("Ana");
  });

  it("fetches the full profile from /auth/me on login", async () => {
    mockedStorage.loadSession.mockResolvedValue(null);
    // login devolve um user incompleto; /auth/me tem o defaultAddress.
    mockedAuthApi.login.mockResolvedValue({
      ...session,
      user: { ...user, defaultAddress: null },
    });
    mockedAuthApi.getMe.mockResolvedValue({
      ...user,
      defaultAddress: { id: "a1", city: "Bom Jardim", isDefault: true },
    });

    renderProbe();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    fireEvent.press(screen.getByTestId("login"));

    await waitFor(() => expect(screen.getByTestId("name")).toHaveTextContent("Ana"));
    expect(mockedAuthApi.getMe).toHaveBeenCalled();
  });

  it("falls back to the login user when /auth/me fails", async () => {
    mockedStorage.loadSession.mockResolvedValue(null);
    mockedAuthApi.login.mockResolvedValue({ ...session, user });
    mockedAuthApi.getMe.mockRejectedValue(new Error("network"));

    renderProbe();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    fireEvent.press(screen.getByTestId("login"));

    await waitFor(() => expect(screen.getByTestId("name")).toHaveTextContent("Ana"));
  });

  it("clears everything on logout", async () => {
    mockedStorage.loadSession.mockResolvedValue(session);
    mockedAuthApi.getMe.mockResolvedValue(user);

    renderProbe();
    await waitFor(() => expect(screen.getByTestId("authed")).toHaveTextContent("true"));

    fireEvent.press(screen.getByTestId("logout"));

    await waitFor(() => expect(screen.getByTestId("authed")).toHaveTextContent("false"));
    expect(mockedStorage.clearSession).toHaveBeenCalled();
  });

  it("registers the push token after a successful login", async () => {
    mockedStorage.loadSession.mockResolvedValue(null);
    mockedAuthApi.login.mockResolvedValue({ ...session, user });

    renderProbe();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    fireEvent.press(screen.getByTestId("login"));

    await waitFor(() => expect(mockedPush.registerForPush).toHaveBeenCalled());
  });

  it("still logs in when push registration rejects", async () => {
    mockedStorage.loadSession.mockResolvedValue(null);
    mockedAuthApi.login.mockResolvedValue({ ...session, user });
    mockedPush.registerForPush.mockRejectedValueOnce(new Error("no projectId"));

    renderProbe();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    fireEvent.press(screen.getByTestId("login"));

    await waitFor(() => expect(screen.getByTestId("authed")).toHaveTextContent("true"));
    expect(screen.getByTestId("name")).toHaveTextContent("Ana");
  });

  it("unregisters the push token on logout", async () => {
    mockedStorage.loadSession.mockResolvedValue(session);
    mockedAuthApi.getMe.mockResolvedValue(user);

    renderProbe();
    await waitFor(() => expect(screen.getByTestId("authed")).toHaveTextContent("true"));
    await waitFor(() => expect(mockedPush.registerForPush).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId("logout"));

    await waitFor(() =>
      expect(mockedPush.unregisterPushToken).toHaveBeenCalledWith(
        "ExponentPushToken[x]"
      )
    );
  });
});

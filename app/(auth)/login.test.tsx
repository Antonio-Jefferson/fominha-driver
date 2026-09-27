import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "./login";
import { useAuth } from "../../src/auth/AuthContext";

jest.mock("../../src/auth/AuthContext");
jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function setup(login = jest.fn().mockResolvedValue(undefined)) {
  mockedUseAuth.mockReturnValue({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login,
    logout: jest.fn(),
    refreshUser: jest.fn(),
  });
  render(<LoginScreen />);
  return login;
}

describe("LoginScreen", () => {
  it("shows a validation error for a malformed email", async () => {
    const login = setup();

    fireEvent.changeText(screen.getByLabelText("E-mail"), "nope");
    fireEvent.changeText(screen.getByLabelText("Senha"), "secret");
    fireEvent.press(screen.getByText("Entrar"));

    await waitFor(() => expect(screen.getByText("E-mail inválido")).toBeTruthy());
    expect(login).not.toHaveBeenCalled();
  });

  it("calls login with the typed credentials", async () => {
    const login = setup();

    fireEvent.changeText(screen.getByLabelText("E-mail"), "ana@example.com");
    fireEvent.changeText(screen.getByLabelText("Senha"), "secret");
    fireEvent.press(screen.getByText("Entrar"));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: "ana@example.com",
        password: "secret",
      })
    );
  });

  it("surfaces the server error message", async () => {
    const login = jest.fn().mockRejectedValue(new Error("Credenciais inválidas"));
    setup(login);

    fireEvent.changeText(screen.getByLabelText("E-mail"), "ana@example.com");
    fireEvent.changeText(screen.getByLabelText("Senha"), "wrong");
    fireEvent.press(screen.getByText("Entrar"));

    await waitFor(() =>
      expect(screen.getByText("Credenciais inválidas")).toBeTruthy()
    );
  });
});

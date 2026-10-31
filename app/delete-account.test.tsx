import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import DeleteAccountScreen from "./delete-account";
import { useAuth } from "../src/auth/AuthContext";
import { deleteAccount } from "../src/api/auth";
import { ApiError } from "../src/api/errors";

jest.mock("../src/auth/AuthContext");
jest.mock("../src/api/auth");
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
}));
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedDelete = deleteAccount as jest.MockedFunction<typeof deleteAccount>;
const logout = jest.fn().mockResolvedValue(undefined);

/** Aperta o botão "Excluir" do Alert de confirmação. */
function confirmAlert() {
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
  buttons.find((b: { text: string }) => b.text === "Excluir").onPress();
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  mockedUseAuth.mockReturnValue({ logout } as never);
});

describe("DeleteAccountScreen", () => {
  it("pede a senha antes de confirmar", () => {
    render(<DeleteAccountScreen />);
    fireEvent.press(screen.getByText("Excluir minha conta"));
    expect(screen.getByText("Digite sua senha para confirmar.")).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("exclui, desloga e volta para o login", async () => {
    mockedDelete.mockResolvedValue(undefined);
    render(<DeleteAccountScreen />);
    fireEvent.changeText(screen.getByLabelText("Sua senha"), "Senha123");
    fireEvent.press(screen.getByText("Excluir minha conta"));
    confirmAlert();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(auth)/login"));
    expect(mockedDelete).toHaveBeenCalledWith("Senha123");
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("mostra a mensagem do backend quando não pode excluir", async () => {
    mockedDelete.mockRejectedValue(
      new ApiError(409, "Você ainda tem saldo ou saque em andamento.")
    );
    render(<DeleteAccountScreen />);
    fireEvent.changeText(screen.getByLabelText("Sua senha"), "Senha123");
    fireEvent.press(screen.getByText("Excluir minha conta"));
    confirmAlert();

    expect(await screen.findByText("Você ainda tem saldo ou saque em andamento.")).toBeTruthy();
    expect(logout).not.toHaveBeenCalled();
  });
});

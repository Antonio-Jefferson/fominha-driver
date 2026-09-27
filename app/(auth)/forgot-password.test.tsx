import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import ForgotPasswordScreen from "./forgot-password";
import * as authApi from "../../src/api/auth";

jest.mock("../../src/api/auth");
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;

beforeEach(() => jest.clearAllMocks());

async function advanceToResetStep() {
  mockedAuthApi.requestPasswordReset.mockResolvedValue({});
  fireEvent.changeText(screen.getByLabelText("E-mail"), "ana@example.com");
  fireEvent.press(screen.getByText("Enviar código"));
  await waitFor(() => expect(screen.getByLabelText("Código")).toBeTruthy());
}

describe("ForgotPasswordScreen", () => {
  it("requests a reset code", async () => {
    render(<ForgotPasswordScreen />);
    await advanceToResetStep();

    expect(mockedAuthApi.requestPasswordReset).toHaveBeenCalledWith(
      "ana@example.com"
    );
  });

  it("resets the password with the code", async () => {
    mockedAuthApi.resetPassword.mockResolvedValue({});
    render(<ForgotPasswordScreen />);
    await advanceToResetStep();

    fireEvent.changeText(screen.getByLabelText("Código"), "123456");
    fireEvent.changeText(screen.getByLabelText("Nova senha"), "novaSenha1");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "novaSenha1");
    fireEvent.press(screen.getByText("Redefinir senha"));

    await waitFor(() =>
      expect(mockedAuthApi.resetPassword).toHaveBeenCalledWith({
        email: "ana@example.com",
        code: "123456",
        newPassword: "novaSenha1",
      })
    );
  });

  it("blocks the reset when the passwords do not match", async () => {
    render(<ForgotPasswordScreen />);
    await advanceToResetStep();

    fireEvent.changeText(screen.getByLabelText("Código"), "123456");
    fireEvent.changeText(screen.getByLabelText("Nova senha"), "novaSenha1");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "outraSenha1");
    fireEvent.press(screen.getByText("Redefinir senha"));

    await waitFor(() =>
      expect(screen.getByText("As senhas não conferem")).toBeTruthy()
    );
    expect(mockedAuthApi.resetPassword).not.toHaveBeenCalled();
  });

  it("shows a confirmation after a successful reset", async () => {
    mockedAuthApi.resetPassword.mockResolvedValue({});
    render(<ForgotPasswordScreen />);
    await advanceToResetStep();

    fireEvent.changeText(screen.getByLabelText("Código"), "123456");
    fireEvent.changeText(screen.getByLabelText("Nova senha"), "novaSenha1");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "novaSenha1");
    fireEvent.press(screen.getByText("Redefinir senha"));

    await waitFor(() =>
      expect(screen.getByText("Senha redefinida com sucesso.")).toBeTruthy()
    );
  });
});

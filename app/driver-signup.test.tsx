import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import DriverSignupScreen from "./driver-signup";
import { signupDriver } from "../src/api/driver";
import { ApiError } from "../src/api/errors";

const mockReplace = jest.fn();
const mockLogout = jest.fn();
const mockRefreshDriver = jest.fn().mockResolvedValue(undefined);

jest.mock("../src/api/driver");
jest.mock("expo-router", () => ({
  Redirect: () => null,
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
}));
jest.mock("../src/auth/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "ana@example.com", full_name: "Ana Souza", phone: null, defaultAddress: { city: "Santa Inês" } },
    isAuthenticated: true,
    logout: mockLogout,
  }),
}));
jest.mock("../src/driver/DriverContext", () => ({
  useDriver: () => ({ hasSignedUp: false, refreshDriver: mockRefreshDriver }),
}));

const mockedSignup = signupDriver as jest.MockedFunction<typeof signupDriver>;

function fill() {
  fireEvent.changeText(screen.getByLabelText("CPF"), "52998224725");
  fireEvent.changeText(screen.getByLabelText("Telefone"), "98999998888");
}

describe("DriverSignupScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("pré-preenche nome e cidade da conta e aplica máscara no CPF", () => {
    render(<DriverSignupScreen />);
    expect(screen.getByLabelText("Nome completo").props.value).toBe("Ana Souza");
    fill();
    expect(screen.getByLabelText("CPF").props.value).toBe("529.982.247-25");
    expect(screen.getByLabelText("Telefone").props.value).toBe("(98) 99999-8888");
  });

  it("rejeita CPF com dígito verificador errado sem chamar a API", async () => {
    render(<DriverSignupScreen />);
    fireEvent.changeText(screen.getByLabelText("CPF"), "52998224726");
    fireEvent.changeText(screen.getByLabelText("Telefone"), "98999998888");
    fireEvent.press(screen.getByText("Enviar cadastro"));
    await waitFor(() => expect(screen.getByText("Informe um CPF válido")).toBeTruthy());
    expect(mockedSignup).not.toHaveBeenCalled();
  });

  it("quando o backend diz que já existe cadastro, sincroniza e sai do formulário em vez de ficar em loop", async () => {
    mockedSignup.mockRejectedValue(new ApiError(409, "Você já tem um cadastro de entregador"));
    render(<DriverSignupScreen />);
    fill();
    fireEvent.press(screen.getByText("Enviar cadastro"));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
    expect(mockRefreshDriver).toHaveBeenCalled();
  });

  it("mostra erro de CPF duplicado no campo CPF", async () => {
    mockedSignup.mockRejectedValue(new ApiError(409, "Este CPF já está cadastrado como entregador"));
    render(<DriverSignupScreen />);
    fill();
    fireEvent.press(screen.getByText("Enviar cadastro"));
    await waitFor(() => expect(screen.getByText(/CPF já está cadastrado/)).toBeTruthy());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("envia o cadastro e vai para a análise", async () => {
    mockedSignup.mockResolvedValue({} as never);
    render(<DriverSignupScreen />);
    fill();
    fireEvent.press(screen.getByText("Moto"));
    fireEvent.press(screen.getByText("Enviar cadastro"));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/pending-approval"));
    expect(mockedSignup).toHaveBeenCalledWith(
      expect.objectContaining({ tx_cpf: "52998224725", tx_vehicle_type: "Moto", tx_city: "Santa Inês" })
    );
  });

  it("oferece sair da conta", () => {
    render(<DriverSignupScreen />);
    fireEvent.press(screen.getByText("Entrar com outra conta"));
    expect(mockLogout).toHaveBeenCalled();
  });
});

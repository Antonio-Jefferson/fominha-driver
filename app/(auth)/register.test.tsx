import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RegisterScreen from "./register";
import * as authApi from "../../src/api/auth";
import * as legalApi from "../../src/api/legal";
import { useAuth } from "../../src/auth/AuthContext";

jest.mock("../../src/api/auth");
jest.mock("../../src/api/legal");
jest.mock("../../src/auth/AuthContext");
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedLegalApi = legalApi as jest.Mocked<typeof legalApi>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const login = jest.fn().mockResolvedValue(undefined);

const LEGAL_DOCS: legalApi.LegalDocumentSummary[] = [
  {
    slug: "termos-de-uso",
    title: "Termos de Uso",
    version: "1.0.0",
    versionId: "v1",
    audience: "ALL",
    required: true,
    effectiveAt: "2026-09-02",
  },
  {
    slug: "politica-de-privacidade",
    title: "Política de Privacidade",
    version: "1.0.0",
    versionId: "v2",
    audience: "ALL",
    required: true,
    effectiveAt: "2026-09-02",
  },
];

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <RegisterScreen />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseAuth.mockReturnValue({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login,
    logout: jest.fn(),
    refreshUser: jest.fn(),
  });
  mockedLegalApi.listLegalDocuments.mockResolvedValue(LEGAL_DOCS);
});

async function advanceToCodeStep() {
  mockedAuthApi.requestVerificationCode.mockResolvedValue({});
  fireEvent.changeText(screen.getByLabelText("Nome completo"), "Ana Souza");
  fireEvent.changeText(screen.getByLabelText("E-mail"), "ana@example.com");
  fireEvent.press(screen.getByText("Enviar código"));
  await waitFor(() => expect(screen.getByLabelText("Código")).toBeTruthy());
}

async function advanceToPasswordStep() {
  await advanceToCodeStep();
  mockedAuthApi.confirmVerificationCode.mockResolvedValue({ signupToken: "tok" });
  fireEvent.changeText(screen.getByLabelText("Código"), "123456");
  fireEvent.press(screen.getByText("Confirmar código"));
  await waitFor(() => expect(screen.getByLabelText("Senha")).toBeTruthy());
}

async function acceptAllTerms() {
  await waitFor(() =>
    expect(
      screen.getByLabelText("Li e concordo com Termos de Uso")
    ).toBeTruthy()
  );
  fireEvent.press(screen.getByLabelText("Li e concordo com Termos de Uso"));
  fireEvent.press(
    screen.getByLabelText("Li e concordo com Política de Privacidade")
  );
}

describe("RegisterScreen", () => {
  it("requests a verification code for the typed email", async () => {
    renderScreen();
    await advanceToCodeStep();

    expect(mockedAuthApi.requestVerificationCode).toHaveBeenCalledWith({
      email: "ana@example.com",
      name: "Ana Souza",
    });
  });

  it("exchanges the code for a signup token", async () => {
    renderScreen();
    await advanceToPasswordStep();

    expect(mockedAuthApi.confirmVerificationCode).toHaveBeenCalledWith({
      email: "ana@example.com",
      code: "123456",
    });
  });

  it("signs up and logs in with the collected data", async () => {
    mockedAuthApi.signup.mockResolvedValue({});
    renderScreen();
    await advanceToPasswordStep();

    fireEvent.press(screen.getByText("Zé Doca"));
    fireEvent.changeText(screen.getByLabelText("Senha"), "secret123");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "secret123");
    await acceptAllTerms();
    fireEvent.press(screen.getByText("Criar minha conta"));

    await waitFor(() =>
      expect(mockedAuthApi.signup).toHaveBeenCalledWith({
        fullName: "Ana Souza",
        email: "ana@example.com",
        phone: "",
        city: "Zé Doca",
        password: "secret123",
        signupToken: "tok",
        acceptedTerms: ["termos-de-uso", "politica-de-privacidade"],
      })
    );
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: "ana@example.com",
        password: "secret123",
      })
    );
  });

  it("blocks the signup when the passwords do not match", async () => {
    renderScreen();
    await advanceToPasswordStep();

    fireEvent.press(screen.getByText("Zé Doca"));
    fireEvent.changeText(screen.getByLabelText("Senha"), "secret123");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "outra123");
    await acceptAllTerms();
    fireEvent.press(screen.getByText("Criar minha conta"));

    await waitFor(() =>
      expect(screen.getByText("As senhas não conferem")).toBeTruthy()
    );
    expect(mockedAuthApi.signup).not.toHaveBeenCalled();
  });

  it("shows the server message when the code is wrong", async () => {
    renderScreen();
    await advanceToCodeStep();

    mockedAuthApi.confirmVerificationCode.mockRejectedValue(
      new Error("Código inválido")
    );
    fireEvent.changeText(screen.getByLabelText("Código"), "000000");
    fireEvent.press(screen.getByText("Confirmar código"));

    await waitFor(() => expect(screen.getByText("Código inválido")).toBeTruthy());
  });

  it("não conclui o cadastro sem aceitar os documentos obrigatórios", async () => {
    renderScreen();
    await advanceToPasswordStep();

    fireEvent.press(screen.getByText("Zé Doca"));
    fireEvent.changeText(screen.getByLabelText("Senha"), "secret123");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "secret123");
    await waitFor(() =>
      expect(
        screen.getByLabelText("Li e concordo com Termos de Uso")
      ).toBeTruthy()
    );
    fireEvent.press(screen.getByText("Criar minha conta"));

    await waitFor(() =>
      expect(
        screen.getByText("Você precisa aceitar os documentos obrigatórios")
      ).toBeTruthy()
    );
    expect(mockedAuthApi.signup).not.toHaveBeenCalled();
  });

  it("envia os slugs aceitos junto com o cadastro", async () => {
    mockedAuthApi.signup.mockResolvedValue({});
    renderScreen();
    await advanceToPasswordStep();

    fireEvent.press(screen.getByText("Zé Doca"));
    fireEvent.changeText(screen.getByLabelText("Senha"), "secret123");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "secret123");
    await acceptAllTerms();
    fireEvent.press(screen.getByText("Criar minha conta"));

    await waitFor(() =>
      expect(mockedAuthApi.signup).toHaveBeenCalledWith(
        expect.objectContaining({
          acceptedTerms: ["termos-de-uso", "politica-de-privacidade"],
        })
      )
    );
  });
});

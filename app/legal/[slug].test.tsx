import { ActivityIndicator } from "react-native";
import { render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LegalDocumentScreen from "./[slug]";
import * as legalApi from "../../src/api/legal";

jest.mock("../../src/api/legal");
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ slug: "termos-de-uso" }),
  Stack: { Screen: () => null },
}));

const mockedLegalApi = legalApi as jest.Mocked<typeof legalApi>;

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <LegalDocumentScreen />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("LegalDocumentScreen", () => {
  it("shows a spinner while the document loads", () => {
    mockedLegalApi.getLegalDocument.mockReturnValue(new Promise(() => {}));

    const { UNSAFE_getByType } = renderScreen();

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("renders the title and markdown body once the document loads", async () => {
    mockedLegalApi.getLegalDocument.mockResolvedValue({
      slug: "termos-de-uso",
      title: "Termos de Uso",
      version: "1.0.0",
      versionId: "v1",
      audience: "ALL",
      required: true,
      effectiveAt: "2026-09-02",
      bodyMarkdown: "# Termos\n\nConteúdo do documento.",
    });

    renderScreen();

    await waitFor(() =>
      expect(screen.getByText("Conteúdo do documento.")).toBeTruthy()
    );
    expect(mockedLegalApi.getLegalDocument).toHaveBeenCalledWith(
      "termos-de-uso"
    );
  });

  it("shows an error state when the document fails to load", async () => {
    mockedLegalApi.getLegalDocument.mockRejectedValue(new Error("network"));

    renderScreen();

    await waitFor(() =>
      expect(
        screen.getByText("Não foi possível carregar o documento")
      ).toBeTruthy()
    );
  });
});

import { render, screen, fireEvent } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LegalIndexScreen from "./index";
import { listDriverLegalDocuments } from "../../src/api/legal";

jest.mock("../../src/api/legal");
const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));

const mockedList = listDriverLegalDocuments as jest.MockedFunction<
  typeof listDriverLegalDocuments
>;

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LegalIndexScreen />
    </QueryClientProvider>
  );
}

describe("LegalIndexScreen", () => {
  it("lista os documentos e abre o escolhido", async () => {
    mockedList.mockResolvedValue([
      {
        slug: "termos-de-uso",
        title: "Termos de Uso",
        version: "1.3.0",
        versionId: "v1",
        audience: "ALL",
        required: true,
        effectiveAt: "2026-10-15",
      },
      {
        slug: "politica-de-privacidade",
        title: "Política de Privacidade",
        version: "1.2.0",
        versionId: "v2",
        audience: "ALL",
        required: true,
        effectiveAt: "2026-10-15",
      },
    ]);
    renderScreen();

    fireEvent.press(await screen.findByText("Política de Privacidade"));
    expect(screen.getByText("Termos de Uso")).toBeTruthy();
    expect(mockPush).toHaveBeenCalledWith("/legal/politica-de-privacidade");
  });

  it("avisa quando não consegue carregar", async () => {
    mockedList.mockRejectedValue(new Error("offline"));
    renderScreen();

    expect(await screen.findByText("Documentos indisponíveis")).toBeTruthy();
  });
});

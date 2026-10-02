import { Text } from "react-native";
import { render, screen, waitFor } from "@testing-library/react-native";
import { DriverProvider, useDriver } from "./DriverContext";
import * as driverApi from "../api/driver";
import { ApiError } from "../api/errors";

jest.mock("../api/driver");
let mockAuth: { isAuthenticated: boolean; user: { id: string } | null } = {
  isAuthenticated: true,
  user: { id: "u1" },
};
jest.mock("../auth/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

const mockedDriverApi = driverApi as jest.Mocked<typeof driverApi>;

function Probe() {
  const { driver, isLoading, hasSignedUp } = useDriver();
  return (
    <>
      <Text testID="loading">{String(isLoading)}</Text>
      <Text testID="signed-up">{String(hasSignedUp)}</Text>
      <Text testID="status">{driver?.enum_status ?? "-"}</Text>
    </>
  );
}

describe("DriverContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = { isAuthenticated: true, user: { id: "u1" } };
  });

  it("carrega o perfil de entregador quando ele já existe", async () => {
    mockedDriverApi.getDriverMe.mockResolvedValue({
      id_driver: "d1",
      enum_status: "ACTIVE",
      tx_status_reason: null,
      tx_full_name: "Fulano",
      tx_phone: "11999999999",
      tx_vehicle_type: "MOTO",
      tx_vehicle_plate: "ABC1234",
      tx_city: "Santa Inês",
      bool_online: false,
    });

    render(
      <DriverProvider>
        <Probe />
      </DriverProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("signed-up")).toHaveTextContent("true");
    expect(screen.getByTestId("status")).toHaveTextContent("ACTIVE");
  });

  it("marca hasSignedUp como false quando o usuário ainda não é entregador (404)", async () => {
    mockedDriverApi.getDriverMe.mockRejectedValue(new ApiError(404, "não encontrado"));

    render(
      <DriverProvider>
        <Probe />
      </DriverProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("signed-up")).toHaveTextContent("false");
    expect(screen.getByTestId("status")).toHaveTextContent("-");
  });

  it("fica em loading desde a primeira renderização depois do login, sem expor 'sem cadastro'", async () => {
    mockAuth = { isAuthenticated: false, user: null };
    mockedDriverApi.getDriverMe.mockResolvedValue({
      id_driver: "d1",
      enum_status: "PENDING_APPROVAL",
      tx_status_reason: null,
      tx_full_name: "Fulano",
      tx_phone: "11999999999",
      tx_vehicle_type: "MOTO",
      tx_vehicle_plate: "ABC1234",
      tx_city: "Santa Inês",
      bool_online: false,
    });

    // Cada renderização com usuário logado e (loading=false, signed-up=false)
    // é o instante em que o TabsLayout redirecionaria para o cadastro.
    const unsafeRenders: string[] = [];
    function Spy() {
      const { isLoading, hasSignedUp } = useDriver();
      if (mockAuth.isAuthenticated && !isLoading && !hasSignedUp) {
        unsafeRenders.push("redirect-para-cadastro");
      }
      return null;
    }

    // Elemento novo a cada chamada: com a mesma referência o React pula o re-render.
    const tree = () => (
      <DriverProvider>
        <Probe />
        <Spy />
      </DriverProvider>
    );
    const { rerender } = render(tree());
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    mockAuth = { isAuthenticated: true, user: { id: "u1" } };
    rerender(tree());

    await waitFor(() => expect(screen.getByTestId("signed-up")).toHaveTextContent("true"));
    expect(unsafeRenders).toEqual([]);
  });
});

import { Text } from "react-native";
import { render, screen, waitFor } from "@testing-library/react-native";
import { DriverProvider, useDriver } from "./DriverContext";
import * as driverApi from "../api/driver";
import { ApiError } from "../api/errors";

jest.mock("../api/driver");
jest.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true }),
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
  beforeEach(() => jest.clearAllMocks());

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
});

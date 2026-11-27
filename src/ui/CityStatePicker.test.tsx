import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useState } from "react";
import { CityStatePicker } from "./CityStatePicker";
import { clearCityCache } from "../api/ibge";

const fetchMock = jest.fn();
const onChangeSpy = jest.fn();

function Harness({ initial = { state: "", city: "" } }: { initial?: { state: string; city: string } }) {
  const [value, setValue] = useState(initial);
  return (
    <CityStatePicker
      value={value}
      onChange={(v) => {
        onChangeSpy(v);
        setValue(v);
      }}
    />
  );
}

beforeEach(() => {
  clearCityCache();
  onChangeSpy.mockReset();
  fetchMock.mockReset();
  (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
});

describe("CityStatePicker", () => {
  it("cidade fica bloqueada até escolher o estado", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Escolher cidade").props.accessibilityState).toEqual({ disabled: true });
    expect(screen.getByText("Escolha o estado antes")).toBeTruthy();
  });

  it("escolhe o estado, busca sem acento e escolhe a cidade com o nome oficial", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ nome: "Bom Jardim" }, { nome: "São Luís" }, { nome: "Zé Doca" }],
    });
    render(<Harness />);
    fireEvent.press(screen.getByLabelText("Escolher estado"));
    fireEvent.press(screen.getByLabelText("Maranhão (MA)"));
    expect(onChangeSpy).toHaveBeenLastCalledWith({ state: "MA", city: "" });

    fireEvent.press(screen.getByLabelText("Escolher cidade"));
    await waitFor(() => expect(screen.getByLabelText("Buscar cidade")).toBeTruthy());
    fireEvent.changeText(screen.getByLabelText("Buscar cidade"), "ze");
    expect(screen.queryByLabelText("São Luís")).toBeNull();
    fireEvent.press(screen.getByLabelText("Zé Doca"));
    expect(onChangeSpy).toHaveBeenLastCalledWith({ state: "MA", city: "Zé Doca" });
    expect(screen.getByText("Zé Doca")).toBeTruthy();
  });

  it("trocar o estado limpa a cidade", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [{ nome: "Recife" }] });
    render(<Harness initial={{ state: "MA", city: "Zé Doca" }} />);
    fireEvent.press(screen.getByLabelText("Escolher estado"));
    fireEvent.press(screen.getByLabelText("Pernambuco (PE)"));
    expect(onChangeSpy).toHaveBeenLastCalledWith({ state: "PE", city: "" });
  });

  it("IBGE fora do ar: oferece tentar de novo e deixa digitar a cidade", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<Harness initial={{ state: "SP", city: "" }} />);
    fireEvent.press(screen.getByLabelText("Escolher cidade"));
    await waitFor(() => expect(screen.getByText("Tentar de novo")).toBeTruthy());
    fireEvent.changeText(screen.getByLabelText("Digitar cidade"), "Campinas");
    fireEvent.press(screen.getByText("Usar esta cidade"));
    expect(onChangeSpy).toHaveBeenLastCalledWith({ state: "SP", city: "Campinas" });
  });
});

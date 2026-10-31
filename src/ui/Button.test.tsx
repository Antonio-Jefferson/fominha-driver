import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button } from "./Button";
import { ThemeRoot } from "./ThemeRoot";

function renderButton(props: Partial<React.ComponentProps<typeof Button>> = {}) {
  const onPress = jest.fn();
  render(
    <ThemeRoot scheme="light">
      <Button label="Aceitar" onPress={onPress} {...props} />
    </ThemeRoot>
  );
  return onPress;
}

describe("Button", () => {
  it("chama onPress ao tocar", () => {
    const onPress = renderButton();
    fireEvent.press(screen.getByRole("button", { name: "Aceitar" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("não chama onPress enquanto carrega", () => {
    const onPress = renderButton({ loading: true });
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("não chama onPress quando desabilitado", () => {
    const onPress = renderButton({ disabled: true });
    fireEvent.press(screen.getByRole("button", { name: "Aceitar" }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

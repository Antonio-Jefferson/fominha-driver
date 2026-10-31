import { fireEvent, render, screen } from "@testing-library/react-native";
import { Headphones } from "lucide-react-native";
import { ListGroup, ListRow } from "./ListGroup";

describe("ListRow", () => {
  it("mostra o rótulo e chama onPress", () => {
    const onPress = jest.fn();
    render(
      <ListGroup>
        <ListRow icon={Headphones} label="Ajuda e suporte" onPress={onPress} />
      </ListGroup>
    );
    fireEvent.press(screen.getByRole("button", { name: "Ajuda e suporte" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

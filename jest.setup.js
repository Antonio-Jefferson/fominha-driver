import { configure } from "@testing-library/react-native";

configure({ asyncUtilTimeout: 5000 });

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("react-native-worklets", () =>
  require("react-native-worklets/lib/module/mock")
);
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock")
);

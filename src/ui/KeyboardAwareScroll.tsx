import { cssInterop } from "nativewind";
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
} from "react-native-keyboard-controller";

/**
 * Componentes de teclado do react-native-keyboard-controller, iguais no iOS e
 * no Android (edge-to-edge). Registrados no NativeWind para aceitar
 * `className`/`contentContainerClassName` como os equivalentes do RN.
 */
cssInterop(KeyboardAwareScrollView, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
});
cssInterop(KeyboardAvoidingView, { className: "style" });

export {
  KeyboardAwareScrollView as KeyboardAwareScroll,
  KeyboardAvoidingView,
};

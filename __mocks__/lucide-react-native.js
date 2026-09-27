// lucide-react-native ships ESM-only (.mjs), which jest-expo's transform
// (`\.[jt]sx?$`) does not pick up. Tests never assert on the icon glyph, so a
// lightweight host-component stub per icon name is enough.
const React = require("react");

module.exports = new Proxy(
  {},
  {
    get: (_target, name) => {
      if (name === "__esModule") return true;
      const Icon = (props) => React.createElement("LucideIcon", { name: String(name), ...props });
      Icon.displayName = String(name);
      return Icon;
    },
  }
);

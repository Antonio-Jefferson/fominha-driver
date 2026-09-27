/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: { DEFAULT: "#FFFFFF", dark: "#1F1F1F" },
        foreground: { DEFAULT: "#1F1F1F", dark: "#FFF6E5" },
        primary: { DEFAULT: "#F59E0B", foreground: "#1F1F1F" },
        card: { DEFAULT: "#FFFFFF", dark: "#2A2A2A" },
        muted: { DEFAULT: "#FFF6E5", dark: "#2A2A2A" },
        "muted-foreground": { DEFAULT: "#6B7280", dark: "#A6A6A6" },
        border: { DEFAULT: "#EFE6D5", dark: "#333333" },
        destructive: "#E53935",
      },
      borderRadius: {
        DEFAULT: "10px",
      },
    },
  },
  plugins: [],
};

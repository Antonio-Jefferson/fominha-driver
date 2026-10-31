/** @type {import('tailwindcss').Config} */
const channel = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: channel("background"),
        foreground: channel("foreground"),
        card: channel("card"),
        border: channel("border"),
        money: channel("money"),
        muted: { DEFAULT: channel("muted"), foreground: channel("muted-foreground") },
        primary: {
          DEFAULT: channel("primary"),
          foreground: channel("primary-foreground"),
          text: channel("primary-text"),
        },
        destructive: {
          DEFAULT: channel("destructive"),
          foreground: channel("destructive-foreground"),
        },
        deck: {
          DEFAULT: channel("deck"),
          foreground: channel("deck-foreground"),
          muted: channel("deck-muted"),
          border: channel("deck-border"),
        },
      },
      fontFamily: {
        poppins: ["Poppins_400Regular"],
        "poppins-medium": ["Poppins_500Medium"],
        "poppins-semibold": ["Poppins_600SemiBold"],
        "poppins-bold": ["Poppins_700Bold"],
        "poppins-extrabold": ["Poppins_800ExtraBold"],
      },
      borderRadius: {
        DEFAULT: "10px",
      },
    },
  },
  plugins: [],
};

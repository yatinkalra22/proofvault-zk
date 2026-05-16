import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#050b18",
          900: "#0a1628",
          800: "#0f2138",
          700: "#152a4a",
        },
        cyan: {
          electric: "#00d4ff",
          glow: "#5cf0ff",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(0, 212, 255, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;

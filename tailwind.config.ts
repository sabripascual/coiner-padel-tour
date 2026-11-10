import type { Config } from "tailwindcss";

// Paleta de marca — Torneos Totalcoin / COINER PADEL TOUR
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#E8F0FB",  // Soft Blue — fondos
          100: "#D2E1F6",
          500: "#2F6CC0",
          600: "#0B4EA2",
          700: "#0B4EA2", // Totalcoin Blue — color principal
          800: "#093F84",
          900: "#0A2A5B", // Navy
        },
        accent: {
          50: "#FFF3E6",
          300: "#FFB066",
          400: "#F57C00",
          500: "#F57C00", // Totalcoin Orange — acción / CTA
          600: "#D96D00",
        },
        navy: "#0A2A5B",          // textos
        "soft-blue": "#E8F0FB",   // fondos
        "gray-cool": "#94A3B8",   // textos secundarios
        "gray-light": "#F5F7FA",  // divisores / estados
      },
      fontFamily: {
        sans: ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

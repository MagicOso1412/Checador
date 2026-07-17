/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#f4f6fa",
        foreground: "#0d1b3e",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0d1b3e",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#0d1b3e",
        },
        primary: {
          DEFAULT: "#1565c0",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#e3eaf6",
          foreground: "#1565c0",
        },
        muted: {
          DEFAULT: "#eef2f9",
          foreground: "#637290",
        },
        accent: {
          DEFAULT: "#1976d2",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#d32f2f",
          foreground: "#ffffff",
        },
        border: "rgba(21, 101, 192, 0.12)",
        input: {
          DEFAULT: "transparent",
          background: "#eef2f9",
        },
        ring: "#1565c0",
        success: {
          DEFAULT: "#2e7d32",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};

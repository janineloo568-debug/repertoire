import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        garamond: [
          "var(--font-garamond)",
          "EB Garamond",
          "Garamond",
          "Palatino",
          "Georgia",
          "serif",
        ],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        inter: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        /** Align app screens with marketing landing (cream canvas, ink text, borders). */
        sheet: {
          canvas: "#f4f1ea",
          cream: "#faf8f6",
          border: "#d8d8d8",
          muted: "#a3a3a3",
          ink: "#181818",
          accent: "#7c3aed",
          "accent-hover": "#6d28d9",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

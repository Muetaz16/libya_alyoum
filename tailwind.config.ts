import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#D50000",
          hover: "#B30000",
        },
        darkgray: {
          DEFAULT: "#1F2937",
          darker: "#111827",
          lighter: "#374151",
        }
      },
    },
  },
  plugins: [],
};
export default config;

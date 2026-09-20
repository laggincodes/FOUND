import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Editorial core color palette
        background: "#121513",
        surface: "#181C19",
        "surface-container": "#222824",
        "surface-container-low": "#1C211D",
        "surface-container-high": "#272F29",
        "surface-container-highest": "#2E3730",
        "on-surface": "#EFF1EC",
        "on-surface-variant": "#919992",
        outline: "#2C342E",
        "outline-variant": "#232A25",
        error: "#CF6679",

        // Primary (Muted Forest Green)
        primary: {
          DEFAULT: "#3B6647",
          container: "#1E3324",
          fixed: "#284430",
          hover: "#487C57",
          text: "#7DB88F",
        },

        // Secondary (Muted Terracotta / USE FIRST)
        secondary: {
          DEFAULT: "#B35A43",
          fixed: "#2E1C18",
          hover: "#C9674D",
        },

        // Tertiary (Muted Amber / USE SOON)
        tertiary: {
          DEFAULT: "#C4903E",
          fixed: "#2B2314",
          hover: "#D69F47",
        },

        // Priority explicit semantic mapping (Dark & understated)
        priority: {
          first: "#D9775E",
          firstBg: "#291916",
          firstBorder: "#4A2822",
          soon: "#DEAB57",
          soonBg: "#292214",
          soonBorder: "#45371F",
          safe: "#7DB88F",
          safeBg: "#17261C",
          safeBorder: "#27402F",
        },
      },
      fontFamily: {
        serif: ["Newsreader", "Georgia", "serif"],
        sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        xs: "0.25rem",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
        card: "0 2px 8px -2px rgba(0, 0, 0, 0.4)",
        elevated: "0 8px 24px -4px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};
export default config;

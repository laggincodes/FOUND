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
        // Stitch core color palette
        background: "#FAF9FC",
        surface: "#FAF9FC",
        "surface-container": "#EEEDF1",
        "surface-container-low": "#F4F3F7",
        "surface-container-high": "#E9E7EB",
        "surface-container-highest": "#E3E2E6",
        "on-surface": "#1A1C1E",
        "on-surface-variant": "#424842",
        outline: "#727972",
        "outline-variant": "#C2C8C0",
        error: "#BA1A1A",

        // Primary (Green = primary action / healthy / core product)
        primary: {
          DEFAULT: "#32533C",
          container: "#4A6B53",
          fixed: "#C7ECCE",
          hover: "#284330",
        },

        // Secondary (Terracotta = urgent attention / USE FIRST)
        secondary: {
          DEFAULT: "#97472E",
          fixed: "#FFDBD0",
          hover: "#823c26",
        },

        // Tertiary (Amber = use soon / caution / USE SOON)
        tertiary: {
          DEFAULT: "#664500",
          fixed: "#FFDEAE",
          hover: "#523700",
        },

        // Priority explicit semantic mapping
        priority: {
          first: "#97472E",
          firstBg: "#FFDBD0",
          firstBorder: "#F5C2B4",
          soon: "#664500",
          soonBg: "#FFDEAE",
          soonBorder: "#FAD090",
          safe: "#32533C",
          safeBg: "#C7ECCE",
          safeBorder: "#A8DEB4",
        },
      },
      fontFamily: {
        serif: ["Newsreader", "Georgia", "serif"],
        sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        xs: "0.125rem",
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(26, 28, 30, 0.04), 0 1px 2px -1px rgba(26, 28, 30, 0.03)",
        card: "0 2px 8px -2px rgba(26, 28, 30, 0.06), 0 1px 4px -1px rgba(26, 28, 30, 0.03)",
        elevated: "0 8px 24px -4px rgba(26, 28, 30, 0.08), 0 3px 8px -2px rgba(26, 28, 30, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;

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
        "on-secondary-fixed-variant": "#005236",
        "surface-tint": "#005bc0",
        "on-secondary-fixed": "#002113",
        "on-background": "#191c23",
        "outline": "#727785",
        "tertiary-fixed-dim": "#ffb691",
        "surface-bright": "#f9f9ff",
        "on-secondary": "#ffffff",
        "error": "#ba1a1a",
        "on-tertiary-container": "#0e0200",
        "surface": "#f9f9ff",
        "on-error": "#ffffff",
        "on-tertiary-fixed-variant": "#783100",
        "surface-container-high": "#e6e8f2",
        "surface-variant": "#e0e2ec",
        "secondary": "#006c49",
        "surface-dim": "#d8d9e3",
        "tertiary": "#9e4300",
        "primary-container": "#1a73e8",
        "primary-fixed": "#d8e2ff",
        "surface-container": "#ecedf7",
        "on-tertiary-fixed": "#341100",
        "on-error-container": "#93000a",
        "on-primary": "#ffffff",
        "inverse-surface": "#2d3038",
        "on-primary-fixed-variant": "#004493",
        "secondary-fixed-dim": "#4edea3",
        "background": "#f9f9ff",
        "on-primary-container": "#ffffff",
        "inverse-primary": "#adc7ff",
        "surface-container-lowest": "#ffffff",
        "error-container": "#ffdad6",
        "primary-fixed-dim": "#adc7ff",
        "on-surface-variant": "#414754",
        "on-surface": "#191c23",
        "outline-variant": "#c1c6d6",
        "inverse-on-surface": "#eff0fa",
        "secondary-container": "#6cf8bb",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#c55500",
        "on-primary-fixed": "#001a41",
        "surface-container-low": "#f2f3fd",
        "on-secondary-container": "#00714d",
        "surface-container-highest": "#e0e2ec",
        "secondary-fixed": "#6ffbbe",
        "primary": "#005bbf",
        "tertiary-fixed": "#ffdbcb"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["Inter", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [],
};
export default config;

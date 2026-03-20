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
        bg: "#FAFAF8",
        primary: "#111827",
        secondary: "#6B7280",
        muted: "#9CA3AF",
        green: "#059669",
        gold: "#F59E0B",
        error: "#DC2626",
        warning: "#D97706",
        "card-border": "#E5E7EB",
        "sidebar-dark": "#1F2937",
        "table-header": "#F9FAFB",
        "row-border": "#F3F4F6",
        "badge-green-bg": "#ECFDF5",
        "badge-amber-bg": "#FEF3C7",
        "badge-indigo-bg": "#EEF2FF",
      },
      fontFamily: {
        headline: ["var(--font-space-grotesk)", '"Space Grotesk"', "system-ui", "sans-serif"],
        body: ["var(--font-inter)", '"Inter"', "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", '"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        badge: "100px",
      },
      spacing: {
        "page-top": "40px",
        "page-x": "48px",
        "section-gap": "32px",
        "group-gap": "24px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

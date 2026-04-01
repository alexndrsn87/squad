import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SQUAD design tokens
        brand: {
          DEFAULT: "#B8FF3C",
          dark: "#9AE620",
          muted: "#B8FF3C33",
        },
        bg: {
          DEFAULT: "#07070F",
          card: "#0F0F1A",
          elevated: "#161625",
          border: "#1E1E35",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#9090A8",
          muted: "#5A5A75",
        },
        status: {
          in: "#B8FF3C",
          out: "#FF4C4C",
          maybe: "#FFB83C",
          reserve: "#9090A8",
          paid: "#B8FF3C",
          unpaid: "#FF4C4C",
        },
      },
      fontFamily: {
        display: ["var(--font-bebas)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

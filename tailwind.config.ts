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
        pitch: {
          deep: "#050a08",
          shadow: "#0a1810",
          glow: "#143d28",
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
        "float": "float 18s ease-in-out infinite",
        "float-delayed": "float 22s ease-in-out infinite 2s",
        "drift": "drift 24s ease-in-out infinite",
        "spin-y": "spinY 14s linear infinite",
        "shimmer": "shimmer 8s ease-in-out infinite",
        "grid-pulse": "gridPulse 12s ease-in-out infinite",
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
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(2%, -3%) scale(1.03)" },
          "66%": { transform: "translate(-3%, 2%) scale(0.97)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-4%, 3%)" },
        },
        spinY: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.85" },
        },
        gridPulse: {
          "0%, 100%": { opacity: "0.06" },
          "50%": { opacity: "0.12" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

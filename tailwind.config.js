/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        cosmic: {
          void: "#0a0e1a",
          deep: "#12182a",
          nebula: "#1e2a4a",
          accent: "#7c3aed",
          glow: "#a78bfa",
          star: "#fef3c7",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(124, 58, 237, 0.25)",
      },
    },
  },
  plugins: [],
};

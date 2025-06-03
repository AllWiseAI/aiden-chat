/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,html}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./out/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        main: "var(--main-color)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      screens: {
        xss: "350px", // zFold
        sm: "640px",
        headerMd: "850px",
        xl: "1350px",
        "2xl": "1500px",
        "3xl": "1620px",
        "4xl": "1800px",
      },
    },
  },
  plugins: [],
  experimental: {
    disableLayerVariables: true
  }
};

export default tailwindConfig;

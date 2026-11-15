import type { Config } from "tailwindcss";

export default {
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
        brand: {
          50: "#fff1f0",
          100: "#ffdfdb",
          500: "#d9381e",
          600: "#c02710",
          700: "#a11d0a",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

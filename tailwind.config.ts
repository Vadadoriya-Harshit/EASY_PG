import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        surface: v("surface"),
        brand: v("brand"),
        accent: v("accent"),
        ink: v("ink"),
        mute: v("mute"),
        ok: v("ok"),
        warn: v("warn"),
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', '"Plus Jakarta Sans"', '"Noto Sans Gujarati"', '"Noto Sans Devanagari"', "system-ui", "sans-serif"],
        sans: ['"Plus Jakarta Sans"', '"Inter Variable"', '"Noto Sans Gujarati"', '"Noto Sans Devanagari"', "system-ui", "sans-serif"],
        serif: ['"Cinzel"', '"Playfair Display"', "Georgia", "serif"],
        gujarati: ['"Noto Sans Gujarati"', "sans-serif"],
        hindi: ['"Noto Sans Devanagari"', "sans-serif"],
      },
      borderRadius: { xl2: "1.25rem", xl3: "2rem" },
      keyframes: {
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(4%,-6%,0) scale(1.12)" },
        },
        marquee: { to: { transform: "translateX(-50%)" } },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        marquee: "marquee 38s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;

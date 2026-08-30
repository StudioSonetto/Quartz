import {
  defineConfig,
  presetIcons,
  presetWind3,
  presetWebFonts,
  transformerDirectives,
} from "unocss";

export default defineConfig({
  presets: [
    presetIcons(),
    presetWind3(),
    presetWebFonts({
      provider: "fontshare",
      fonts: { "azeret-mono": "Azeret Mono" },
    }),
  ],
  transformers: [transformerDirectives()],
  content: {
    pipeline: {
      include: [/\.vue($|\?)/, /[\\/]modules[\\/].*\.ts($|\?)/],
    },
  },
  theme: {
    colors: {
      accent: "#4a6578",
    },
    breakpoints: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1920px",
      "4xl": "2560px",
    },
  },
  shortcuts: {
    "ui-gutter": "px-6 sm:px-10 lg:px-20 xl:px-40 2xl:px-60 3xl:px-80",
    "ui-section": "ui-gutter py-20 lg:py-30",
    "ui-text-3": "text-3 3xl:text-3.5",
    "ui-text-4": "text-4 3xl:text-4.5",
    "ui-text-5": "text-5 3xl:text-5.5",
    "ui-text-6": "text-6 3xl:text-6.5",
  },
});

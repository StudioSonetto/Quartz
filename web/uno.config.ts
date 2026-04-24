import {
  defineConfig,
  presetIcons,
  presetWind3,
  presetWebFonts,
  transformerDirectives,
} from "unocss";

import { fonts } from "./app/utils/fonts";

const createFontConfig = (fonts: readonly string[]) => {
  return fonts.reduce(
    (map, font) => {
      const key = font.toLowerCase().replace(/\s+/g, "-");

      map[key] = font;

      return map;
    },
    {} as Record<string, string>,
  );
};

export default defineConfig({
  presets: [
    presetIcons(),
    presetWind3(),
    presetWebFonts({
      provider: "fontshare",
      fonts: createFontConfig(fonts),
      timeouts: {
        warning: 30000,
        failure: 60000,
      },
    }),
  ],
  transformers: [transformerDirectives()],
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
    "ui-text-3": "text-3 3xl:text-3.5",
    "ui-text-4": "text-4 3xl:text-4.5",
    "ui-text-5": "text-5 3xl:text-5.5",
    "ui-text-6": "text-6 3xl:text-6.5",
  },
});

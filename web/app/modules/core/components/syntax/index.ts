import Panel from "./Panel.vue";

export default {
  type: "core.syntax",
  icon: "i-carbon-code",
  inspector: Panel,
  ai: { fields: { background: '{ type: "none" } | { type: "colour", value: "#RRGGBB" } | { type: "image", value: asset name, fit: "cover" | "contain" | "tile" | "fill" }' } },
  defaultData: () => ({
    language: "typescript",
    theme: "github-dark",
    background: { type: "none" },
    padding: 24,
    radius: 8,
  }),
};

import Panel from "./Panel.vue";

export default {
  type: "core.layout",
  icon: "i-carbon-template",
  inspector: Panel,
  ai: { fields: { background: '{ type: "none" } | { type: "colour", value: "#RRGGBB" } | { type: "image", value: asset name, fit: "cover" | "contain" | "tile" | "fill" }' } },
  defaultData: () => ({
    mode: "free",
    direction: "vertical",
    background: { type: "none" },
    padding: 0,
    columns: 1,
    gap: 0,
    align: "start",
    justify: "start",
  }),
};

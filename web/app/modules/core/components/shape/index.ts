import Panel from "./Panel.vue";

export default {
  type: "core.shape",
  icon: "i-carbon-diamond-outline",
  inspector: Panel,
  ai: {
    fields: {
      fill: '{ type: "none" } | { type: "colour", value: "#RRGGBB" }',
      stroke: '{ type: "none" } | { type: "colour", value: "#RRGGBB" }',
    },
  },
  defaultData: () => ({
    kind: "rect",
    fill: { type: "colour", value: "#3B82F6" },
    stroke: { type: "none" },
    strokeWidth: 0,
    radius: 0,
    sides: 3,
  }),
};

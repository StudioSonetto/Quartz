export default {
  type: "core.shape",
  defaultData: () => ({
    kind: "rect",
    fill: { type: "colour", value: "#3B82F6" },
    stroke: { type: "none" },
    strokeWidth: 0,
    radius: 0,
    sides: 3,
  }),
  ai: { fields: ["fill", "stroke", "strokeWidth"] },
} satisfies ComponentTypeData;

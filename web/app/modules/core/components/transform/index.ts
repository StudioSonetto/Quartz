import Panel from "./Panel.vue";

export default {
  type: "transform",
  icon: "i-carbon-shapes",
  inspector: Panel,
  defaultData: () => ({ position: { x: 0, y: 0, z: 0 }, scale: 1 }),
} satisfies ComponentTypeDef;

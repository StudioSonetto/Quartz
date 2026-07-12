import Panel from "./Panel.vue";

export default {
  type: "model",
  icon: "i-carbon-model-alt",
  inspector: Panel,
  defaultData: () => ({
    type: "box",
    fallback: "none",
    colour: "#FAFAFA",
    texture: "default",
    x: 0,
    y: 0,
    z: 0,
    scale: 1,
  }),
} satisfies ComponentTypeDef;

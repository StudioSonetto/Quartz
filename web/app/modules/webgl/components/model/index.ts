import Panel from "./Panel.vue";

export default {
  type: "webgl.model",
  icon: "i-carbon-model-alt",
  inspector: Panel,
  defaultData: () => ({
    type: "box",
    fallback: "none",
    colour: "#FAFAFA",
    texture: "default",
  }),
};

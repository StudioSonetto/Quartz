import Panel from "./Panel.vue";

export default {
  type: "animation",
  icon: "i-carbon-motion",
  inspector: Panel,
  defaultData: () => ({}),
} satisfies ComponentTypeDef;

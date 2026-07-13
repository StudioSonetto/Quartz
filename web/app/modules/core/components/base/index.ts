import Panel from "./Panel.vue";

export default {
  type: "base",
  icon: "i-carbon-term",
  inspector: Panel,
  defaultData: () => ({}),
} satisfies ComponentTypeDef;

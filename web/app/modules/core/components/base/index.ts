import Panel from "./Panel.vue";

export default {
  type: "core.base",
  icon: "i-carbon-term",
  inspector: Panel,
  defaultData: () => ({}),
} satisfies ComponentTypeDef;

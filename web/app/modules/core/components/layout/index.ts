import Panel from "./Panel.vue";

export default {
  type: "layout",
  icon: "i-carbon-template",
  inspector: Panel,
  defaultData: () => ({}),
} satisfies ComponentTypeDef;

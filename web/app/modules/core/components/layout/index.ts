import Panel from "./Panel.vue";
import data from "./data";

export default {
  ...data,
  icon: "i-carbon-template",
  inspector: Panel,
} satisfies ComponentTypeDef;

import Panel from "./Panel.vue";
import data from "./data";

export default {
  ...data,
  icon: "i-carbon-diamond-outline",
  inspector: Panel,
} satisfies ComponentTypeDef;

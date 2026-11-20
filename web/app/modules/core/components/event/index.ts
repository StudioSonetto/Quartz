import Panel from "./Panel.vue";
import data from "./data";

export default {
  ...data,
  icon: "i-carbon-cursor-1",
  inspector: Panel,
} satisfies ComponentTypeDef;

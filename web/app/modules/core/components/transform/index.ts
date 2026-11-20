import Panel from "./Panel.vue";
import data from "./data";

export default {
  ...data,
  icon: "i-carbon-shapes",
  inspector: Panel,
} satisfies ComponentTypeDef;

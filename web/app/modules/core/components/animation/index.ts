import Panel from "./Panel.vue";
import data from "./data";

export default {
  ...data,
  icon: "i-carbon-continue-filled",
  inspector: Panel,
} satisfies ComponentTypeDef;

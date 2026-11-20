import Panel from "./Panel.vue";
import data from "./data";

export default {
  ...data,
  icon: "i-carbon-media-library",
  inspector: Panel,
} satisfies ComponentTypeDef;

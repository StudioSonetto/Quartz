import Panel from "./Panel.vue";

export default {
  type: "core.event",
  icon: "i-carbon-cursor-1",
  optional: true,
  inspector: Panel,
  defaultData: () => ({ handlers: [] }),
};

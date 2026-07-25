import Panel from "./Panel.vue";

export default {
  type: "core.layout",
  icon: "i-carbon-template",
  inspector: Panel,
  defaultData: () => ({
    mode: "free",
    background: "transparent",
    padding: 0,
    columns: 1,
    gap: 0,
    align: "start",
  }),
};

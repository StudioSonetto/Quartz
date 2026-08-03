import Panel from "./Panel.vue";

export default {
  type: "core.layout",
  icon: "i-carbon-template",
  inspector: Panel,
  defaultData: () => ({
    mode: "free",
    background: { type: "none" },
    padding: 0,
    columns: 1,
    gap: 0,
    align: "start",
  }),
};

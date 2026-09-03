import Panel from "./Panel.vue";

export default {
  type: "core.path",
  icon: "i-carbon-pen",
  inspector: Panel,
  optional: true,
  defaultData: () => ({
    points: [],
    closed: false,
  }),
};

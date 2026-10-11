import Panel from "./Panel.vue";

export default {
  type: "core.transition",
  icon: "i-carbon-arrows-horizontal",
  optional: true,
  inspector: Panel,
  unkeyed: ["kind", "duration", "easing"],
  defaultData: () => ({
    kind: "fade",
    duration: DEFAULT_HANDLER_DURATION,
    easing: "ease-out",
  }),
};

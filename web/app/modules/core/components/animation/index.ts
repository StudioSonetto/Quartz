import Panel from "./Panel.vue";

export default {
  type: "core.animation",
  icon: "i-carbon-continue-filled",
  optional: true,
  inspector: Panel,
  defaultData: () => ({
    states: {},
    duration: 400,
    easing: "ease-out",
    delay: 0,
    repeat: 0,
    repeatType: "loop",
  }),
};

import Panel from "./Panel.vue";

export default {
  type: "core.image",
  icon: "i-carbon-image",
  inspector: Panel,
  defaultData: () => ({
    src: "",
    fit: "cover",
    borderRadius: 0,
    opacity: 1,
  }),
};

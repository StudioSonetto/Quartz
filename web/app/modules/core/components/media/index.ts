import Panel from "./Panel.vue";

export default {
  type: "core.media",
  icon: "i-carbon-media-library",
  inspector: Panel,
  defaultData: () => ({
    src: "",
    fit: "cover",
    borderRadius: 0,
    opacity: 1,
    ...MEDIA_DEFAULTS,
  }),
  ...mediaFields("src"),
};

import Panel from "./Panel.vue";

export default {
  type: "core.syntax",
  icon: "i-carbon-code",
  inspector: Panel,
  defaultData: () => ({
    language: "typescript",
    theme: "github-dark",
    background: { type: "none" },
    padding: 24,
    radius: 8,
  }),
};

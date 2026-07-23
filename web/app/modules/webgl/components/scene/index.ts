import Panel from "./Panel.vue";

export default {
  type: "webgl.scene",
  icon: "i-carbon-web-services-container",
  inspector: Panel,
  defaultData: () => ({ background: "#151515" }),
} satisfies ComponentTypeDef;

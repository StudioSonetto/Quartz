import Scene from "~/components/node/component/Scene.vue";

export default {
  type: "scene",
  icon: "i-carbon-web-services-container",
  inspector: Scene,
  defaultData: () => ({ background: "#151515" }),
} satisfies ComponentTypeDef;
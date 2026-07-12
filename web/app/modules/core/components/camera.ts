import Camera from "~/components/node/component/Camera.vue";

export default {
  type: "camera",
  icon: "i-carbon-camera",
  inspector: Camera,
  defaultData: () => ({ x: 0, y: 0, z: 5 }),
} satisfies ComponentTypeDef;
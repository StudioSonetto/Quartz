import Animation from "~/components/node/component/Animation.vue";

export default {
  type: "animation",
  icon: "i-carbon-motion",
  inspector: Animation,
  defaultData: () => ({}),
} satisfies ComponentTypeDef;
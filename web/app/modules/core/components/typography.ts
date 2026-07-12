import { resolveComponent } from "vue";

export default {
  type: "typography",
  icon: "i-carbon-text-font",
  inspector: resolveComponent("LazyNodeComponentTypography"),
  defaultData: () => ({
    alignment: "left",
    colour: "#151515",
    content: "New Text",
    font: "Azeret Mono",
    size: 30,
    style: [],
    weight: 300,
  }),
} satisfies ComponentTypeDef;

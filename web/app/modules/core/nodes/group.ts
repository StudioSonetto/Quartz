import { markRaw } from "vue";
import Group from "~/components/atelier/render/Group.vue";

export default {
  type: "core.group",
  label: "Group",
  icon: "i-carbon-caret-down",
  accepts: ["core.group", "core.text"],
  defaultComponents: ["core.base", "core.transform", "core.layout"],
  creatable: false,
  sizing: "derived",
  renderer: {
    element: "div",
    render: (node, ctx): RenderResult => {
      const layout = ctx.data(node, "core.layout");

      if (layout.mode !== "grid") {
        return { component: markRaw(Group) };
      }

      const transform = ctx.data(node, "core.transform");

      return {
        style: {
          ...boxStyle(transform, ctx.scale),
          width: "max-content",
          height: "max-content",
          ...backgroundStyle(layout.background, ctx.assetUrl),
          ...gridStyle(layout),
        },
      };
    },
  },
} satisfies NodeTypeDef;

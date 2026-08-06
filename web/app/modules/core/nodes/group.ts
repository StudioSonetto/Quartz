import { markRaw } from "vue";
import Group from "~/components/atelier/render/Group.vue";
import { backgroundStyle, gridStyle } from "~/utils/layoutStyle";

export default {
  type: "core.group",
  label: "Group",
  icon: "i-carbon-caret-down",
  accepts: ["core.group", "core.text", "webgl.canvas"],
  defaultComponents: ["core.base", "core.transform", "core.layout"],
  creatable: false,
  renderer: {
    element: "div",
    render: (node, ctx): RenderResult => {
      const layout = ctx.data(node, "core.layout");

      if (layout.mode !== "grid") {
        return { component: markRaw(Group) };
      }

      const transform = ctx.data(node, "core.transform");

      const xPercent = (transform.position.x / 1920) * 100;
      const yPercent = (transform.position.y / 1080) * 100;

      return {
        style: {
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          width: "max-content",
          height: "max-content",
          zIndex: transform.position.z,
          transform: transformStyle(transform, ctx.scale),
          ...backgroundStyle(layout.background, ctx.assetUrl),
          ...gridStyle(layout),
        },
      };
    },
  },
} satisfies NodeTypeDef;

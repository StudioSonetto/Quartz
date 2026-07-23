import type { WebglApi } from "../types";

export default {
  type: "webgl.object",
  label: "3D Object",
  icon: "i-carbon-cube",
  accepts: [],
  defaultComponents: ["core.base", "core.transform", "webgl.model"],
  renderer: {
    element: "",
    render: (node, ctx) => {
      const webglApi = ctx.module<WebglApi>("webgl");
      const context = webglApi.getCanvasContext(node.parent!.id);

      if (!context) return {};

      webglApi.syncObject(context, node);

      return {};
    },
  },
} satisfies NodeTypeDef;

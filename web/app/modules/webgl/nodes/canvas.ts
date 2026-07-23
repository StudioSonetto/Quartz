import type { WebglApi } from "../types";

export default {
  type: "webgl.canvas",
  label: "3D Canvas",
  icon: "i-carbon-assembly-cluster",
  accepts: ["webgl.object"],
  defaultComponents: ["core.base", "core.transform", "webgl.scene", "webgl.camera"],
  renderer: {
    element: "div",
    render: (node, ctx) => {
      const webglApi = ctx.module<WebglApi>("webgl");
      const transform = ctx.findComponent(node, "core.transform")!.data;

      webglApi.ensureCanvasContext(node);

      const xPercent = (transform.position.x / 1920) * 100;
      const yPercent = (transform.position.y / 1080) * 100;

      return {
        style: {
          top: `${yPercent}%`,
          left: `${xPercent}%`,
          zIndex: transform.z,
          width: `${transform.width}px`,
          height: `${transform.height}px`,
          transform: `scale(${transform.scale * ctx.scale})`,
        },
      };
    },
  },
} satisfies NodeTypeDef;

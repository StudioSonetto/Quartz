import type { WebglApi } from "../types";

export default {
  type: "webgl.canvas",
  label: "3D Canvas",
  icon: "i-carbon-assembly-cluster",
  accepts: ["webgl.object"],
  parents: ["core.group"],
  defaultComponents: [
    "core.base",
    { type: "core.transform", data: { size: { width: 640, height: 360 } } },
    "webgl.scene",
    "webgl.camera",
  ],
  renderer: {
    element: "div",
    render: (node, ctx) => {
      const webglApi = ctx.module<WebglApi>("webgl");
      const transform = ctx.data(node, "core.transform");

      webglApi.ensureCanvasContext(node);

      const xPercent = (transform.position.x / 1920) * 100;
      const yPercent = (transform.position.y / 1080) * 100;

      return {
        style: {
          top: `${yPercent}%`,
          left: `${xPercent}%`,
          zIndex: transform.position.z,
          width: `${transform.size.width}px`,
          height: `${transform.size.height}px`,
          transform: transformStyle(transform, ctx.scale),
        },
      };
    },
  },
} satisfies NodeTypeDef;

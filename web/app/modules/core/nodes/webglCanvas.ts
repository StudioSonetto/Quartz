export const webglCanvas: NodeTypeDef = {
  type: "webgl_canvas",
  label: "3D Canvas",
  icon: "i-carbon-assembly-cluster",
  creatable: true,
  defaultComponents: ["base", "transform", "scene", "camera"],
  renderer: {
    element: "div",
    render: (node, ctx) => {
      const transform = ctx.findComponent(node, "transform")!.data;

      ctx.ensureCanvasContext(node);

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
};

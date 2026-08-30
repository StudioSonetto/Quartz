export default {
  type: "core.shape",
  label: "Shape",
  icon: "i-carbon-diamond-outline",
  accepts: [],
  parents: ["core.group"],
  sizing: "free",
  defaultComponents: [
    "core.base",
    { type: "core.transform", data: { size: { width: 240, height: 240 } } },
    "core.shape",
  ],
  renderer: {
    element: "div",
    render: (node, ctx): RenderResult => {
      const shape = ctx.data(node, "core.shape");
      const transform = ctx.data(node, "core.transform");

      const { width, height } = transform.size;
      const fill = coerceBackground(shape.fill);
      const stroke = coerceBackground(shape.stroke);

      return {
        style: {
          ...boxStyle(transform, ctx.scale),
          width: `${width}px`,
          height: `${height}px`,
        },
        paint: {
          d: parametricPath(
            shape.kind as ShapeKind,
            width,
            height,
            shape.radius,
            shape.sides,
          ),
          fill: fill.type === "colour" ? fill.value : "none",
          stroke: stroke.type === "colour" ? stroke.value : "none",
          strokeWidth: stroke.type === "colour" ? shape.strokeWidth : 0,
          viewBox: `0 0 ${width} ${height}`,
        },
      };
    },
  },
} satisfies NodeTypeDef;

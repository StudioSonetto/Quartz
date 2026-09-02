export default {
  type: "core.shape",
  label: "Shape",
  icon: "i-carbon-diamond-outline",
  accepts: [],
  parents: ["core.group"],
  sizing: "free",
  editing: (node) => {
    const { activeTool } = useAtelierStore();

    if (activeTool !== "pen" && activeTool !== "point") return false;

    return (
      useNodeComponents().getNodeComponent(node.id, "core.shape")?.data.kind ===
      "path"
    );
  },
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
      const path =
        shape.kind === "path" ? ctx.optional(node, "core.path") : undefined;

      const { width, height } = transform.size;
      const fill = coerceBackground(shape.fill);
      const stroke = coerceBackground(shape.stroke);

      const d =
        shape.kind === "path"
          ? pointsToPath(path?.points ?? [], path?.closed ?? false)
          : parametricPath(
              shape.kind as ShapeKind,
              width,
              height,
              shape.radius,
              shape.sides,
            );

      return {
        style: {
          ...boxStyle(transform, ctx.scale),
          width: `${width}px`,
          height: `${height}px`,
        },
        paint: {
          d,
          fill: fill.type === "colour" ? fill.value : "none",
          stroke: stroke.type === "colour" ? stroke.value : "none",
          strokeWidth: stroke.type === "colour" ? shape.strokeWidth : 0,
          viewBox: `0 0 ${width} ${height}`,
        },
      };
    },
  },
  handles: {
    scaleContents: (node) => {
      const { getNodeComponent } = useNodeComponents();
      const { updateComponent } = useDeckStore();

      const component = getNodeComponent(node.id, "core.path");
      const shape = getNodeComponent(node.id, "core.shape");

      if (!component || shape?.data.kind !== "path") return undefined;

      const start = component.data.points as Point[];

      return {
        move: (sx, sy) => {
          component.data.points = scalePoints(start, sx, sy);
        },
        end: () => updateComponent(component),
      };
    },
  },
} satisfies NodeTypeDef;

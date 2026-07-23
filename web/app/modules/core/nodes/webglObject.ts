export default {
  type: "webgl.object",
  label: "3D Object",
  icon: "i-carbon-cube",
  creatable: true,
  accepts: [],
  defaultComponents: ["core.base", "core.transform", "webgl.model"],
  renderer: {
    element: "",
    render: (node, ctx) => {
      const context = ctx.getCanvasContext(node.parent!.id);
      if (!context) return {};
      ctx.syncObject(context, node);
      return {};
    },
  },
} satisfies NodeTypeDef;

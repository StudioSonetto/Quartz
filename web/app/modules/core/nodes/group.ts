export default {
  type: "group",
  label: "Group",
  icon: "i-carbon-caret-down",
  creatable: true,
  accepts: ["group", "text", "webgl_canvas"],
  defaultComponents: ["base", "transform", "layout"],
  renderer: {
    element: "div",
    render: (node, ctx) => {
      const layout = ctx.findComponent(node, "layout")?.data || {};
      return {
        style: {
          margin: `${layout.margin}px`,
          display: "flex",
          alignItems: layout.align,
          justifyContent: layout.justify,
        },
      };
    },
  },
} satisfies NodeTypeDef;

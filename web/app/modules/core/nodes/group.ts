export default {
  type: "core.group",
  label: "Group",
  icon: "i-carbon-caret-down",
  creatable: true,
  accepts: ["core.group", "core.text", "webgl.canvas"],
  defaultComponents: ["core.base", "core.transform", "core.layout"],
  renderer: {
    element: "div",
    render: (node, ctx) => {
      const layout = ctx.findComponent(node, "core.layout")?.data || {};
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

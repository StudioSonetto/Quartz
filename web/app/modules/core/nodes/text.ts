export default {
  type: "core.text",
  label: "Text",
  icon: "i-carbon-text-short-paragraph",
  accepts: [],
  defaultComponents: ["core.base", "core.transform", "core.typography"],
  renderer: {
    element: "p",
    render: (node, ctx) => {
      const typography = ctx.findComponent(node, "core.typography")!.data;
      const transform = ctx.findComponent(node, "core.transform")!.data;

      const xPercent = (transform.position.x / 1920) * 100;
      const yPercent = (transform.position.y / 1080) * 100;

      const textDecorations: string[] = [];
      let fontStyle = "normal";

      typography.style.forEach((style: string) => {
        switch (style) {
          case "italic":
            fontStyle = "italic";
            break;
          case "underline":
            textDecorations.push("underline");
            break;
          case "strikethrough":
            textDecorations.push("line-through");
            break;
        }
      });

      return {
        content: typography.content,
        style: {
          color: typography.colour,
          fontFamily: typography.font,
          fontSize: `${typography.size}px`,
          fontWeight: typography.weight,
          fontStyle,
          textDecoration:
            textDecorations.length > 0 ? textDecorations.join(" ") : "none",
          left: `${xPercent}%`,
          textAlign: typography.alignment,
          top: `${yPercent}%`,
          transform: `scale(${transform.scale * ctx.scale})`,
          zIndex: transform.position.z,
          whiteSpace: "pre-line",
        },
      };
    },
  },
} satisfies NodeTypeDef;

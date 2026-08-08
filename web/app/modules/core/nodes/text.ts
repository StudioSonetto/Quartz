export default {
  type: "core.text",
  label: "Text",
  icon: "i-carbon-text-short-paragraph",
  accepts: [],
  defaultComponents: ["core.base", "core.transform", "core.typography"],
  renderer: {
    element: "p",
    render: (node, ctx) => {
      const typography = ctx.data(node, "core.typography");
      const transform = ctx.data(node, "core.transform");

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

      const autoWidth = transform.size.width === "auto";

      return {
        content: typography.content,
        style: {
          ...boxStyle(transform, ctx.scale),
          color: typography.colour,
          fontFamily: typography.font,
          fontSize: `${typography.size}px`,
          fontWeight: typography.weight,
          fontStyle,
          textDecoration:
            textDecorations.length > 0 ? textDecorations.join(" ") : "none",
          textAlign: typography.alignment,
          width: autoWidth ? "max-content" : `${transform.size.width}px`,
          height:
            transform.size.height === "auto"
              ? "auto"
              : `${transform.size.height}px`,
          whiteSpace: "pre-wrap",
          lineHeight: typography.lineHeight,
          letterSpacing: `${typography.letterSpacing}px`,
          textTransform: typography.textTransform,
          opacity: typography.opacity,
        },
      };
    },
  },
} satisfies NodeTypeDef;

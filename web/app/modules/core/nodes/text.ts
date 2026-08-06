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

      const autoWidth = transform.size.width === "auto";

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
          top: `${yPercent}%`,
          textAlign: typography.alignment,
          width: autoWidth ? "max-content" : `${transform.size.width}px`,
          height:
            transform.size.height === "auto"
              ? "auto"
              : `${transform.size.height}px`,
          transform: transformStyle(transform, ctx.scale),
          zIndex: transform.position.z,
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

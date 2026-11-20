import { highlight, highlightPending } from "../../components/syntax/highlight";
import { typographyStyle } from "../../components/typography/style";
import data from "./data";

export default {
  ...data,
  icon: "i-carbon-code",
  ready: highlightPending,
  renderer: {
    element: "pre",
    render: (node, ctx): RenderResult => {
      const syntax = ctx.data(node, "core.syntax");
      const typography = ctx.data(node, "core.typography");
      const transform = ctx.data(node, "core.transform");

      const source = runsText(toRuns(typography.content));
      const highlighted = highlight(
        node.id,
        source,
        syntax.language,
        syntax.theme,
      );

      const background = coerceBackground(syntax.background);

      return {
        content: highlighted?.spans ?? source,
        style: {
          ...boxStyle(transform, ctx.scale),
          ...typographyStyle(typography),
          ...sizeStyle(transform.size),
          margin: 0,
          padding: `${syntax.padding}px`,
          borderRadius: `${syntax.radius}px`,
          ...(background.type === "none"
            ? { backgroundColor: highlighted?.bg ?? "transparent" }
            : backgroundStyle(background)),
          ...(highlighted?.fg && { color: highlighted.fg }),
          textAlign: typography.alignment,
          lineHeight: typography.lineHeight,
          whiteSpace: "pre-wrap",
        },
      };
    },
  },
} satisfies NodeTypeDef;

import { typographyStyle } from "../components/typography/style";

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

      const runs = toRuns(typography.content);

      const split = runs.some((run) => run.marks?.style !== undefined);
      const spans = runs.some((run) => run.marks)
        ? runs.map((run) => ({
            text: run.text,
            style: typographyStyle(
              split ? { style: typography.style, ...run.marks } : run.marks,
            ),
          }))
        : null;

      return {
        content: spans ?? runsText(runs),
        style: {
          ...boxStyle(transform, ctx.scale),
          ...typographyStyle(typography),
          ...(split && { textDecoration: "none" }),
          ...sizeStyle(transform.size),
          textAlign: typography.alignment,
          whiteSpace: "pre-wrap",
          lineHeight: typography.lineHeight,
        },
      };
    },
  },
} satisfies NodeTypeDef;

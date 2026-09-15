import type { TypographyMarks } from "./types";

const DECORATION: Record<string, string> = {
  underline: "underline",
  strikethrough: "line-through",
};

export function typographyStyle(marks: Partial<TypographyMarks> = {}) {
  const style: Record<string, string | number> = {};

  if (marks.colour !== undefined) style.color = marks.colour;
  if (marks.font !== undefined) style.fontFamily = marks.font;
  if (marks.size !== undefined) style.fontSize = `${marks.size}px`;
  if (marks.weight !== undefined) style.fontWeight = marks.weight;
  if (marks.textTransform !== undefined) {
    style.textTransform = marks.textTransform;
  }
  if (marks.letterSpacing !== undefined) {
    style.letterSpacing = `${marks.letterSpacing}px`;
  }
  if (marks.opacity !== undefined) style.opacity = marks.opacity;

  if (marks.style !== undefined) {
    const lines = marks.style.map((entry) => DECORATION[entry]).filter(Boolean);

    style.fontStyle = marks.style.includes("italic") ? "italic" : "normal";
    style.textDecoration = lines.length ? lines.join(" ") : "none";
  }

  return style;
}

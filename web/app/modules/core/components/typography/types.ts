export interface TypographyMarks {
  colour: string;
  font: string;
  size: number;
  weight: number;
  style: string[];
  letterSpacing: number;
  textTransform: string;
  opacity: number;
}

export interface Run {
  text: string;
  marks?: Partial<TypographyMarks>;
}

export const MARK_KEYS = [
  "font",
  "size",
  "weight",
  "letterSpacing",
  "textTransform",
  "opacity",
  "colour",
  "style",
] as const satisfies readonly (keyof TypographyMarks)[];

export type AlignOp =
  | "left"
  | "centreH"
  | "right"
  | "top"
  | "middleV"
  | "bottom";

export interface NodeRect {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Frame {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function alignPositions(
  rects: NodeRect[],
  op: AlignOp,
  frame: Frame,
): Record<string, { left: number; top: number }> {
  const out: Record<string, { left: number; top: number }> = {};
  const fRight = frame.left + frame.width;
  const fBottom = frame.top + frame.height;
  const fCentreX = frame.left + frame.width / 2;
  const fMiddleY = frame.top + frame.height / 2;

  for (const r of rects) {
    let { left, top } = r;
    switch (op) {
      case "left":
        left = frame.left;
        break;
      case "right":
        left = fRight - r.width;
        break;
      case "centreH":
        left = fCentreX - r.width / 2;
        break;
      case "top":
        top = frame.top;
        break;
      case "bottom":
        top = fBottom - r.height;
        break;
      case "middleV":
        top = fMiddleY - r.height / 2;
        break;
    }
    out[r.id] = { left: Math.round(left), top: Math.round(top) };
  }
  return out;
}

export function distributePositions(
  rects: NodeRect[],
  axis: "h" | "v",
): Record<string, { left: number; top: number }> {
  const out: Record<string, { left: number; top: number }> = {};
  if (rects.length < 3) {
    for (const r of rects) out[r.id] = { left: r.left, top: r.top };
    return out;
  }
  const key = axis === "h" ? "left" : "top";
  const size = axis === "h" ? "width" : "height";
  const centre = (r: NodeRect) => r[key] + r[size] / 2;

  const sorted = [...rects].sort((a, b) => centre(a) - centre(b));
  const first = centre(sorted[0]!);
  const last = centre(sorted[sorted.length - 1]!);
  const step = (last - first) / (sorted.length - 1);

  sorted.forEach((r, i) => {
    const c = first + step * i;
    const pos = Math.round(c - r[size] / 2);
    out[r.id] =
      axis === "h" ? { left: pos, top: r.top } : { left: r.left, top: pos };
  });
  return out;
}

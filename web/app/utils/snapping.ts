import type { Rect } from "~/utils/selection";
import { isDescendantPath, isSelfOrDescendantPath } from "~/utils/nodePath";

export interface SnapLine {
  axis: "x" | "y";
  pos: number;
  // Perpendicular extent of the source element, in canvas units. When present
  // the guide is drawn only across this span (extended to cover the moving box
  // in `resolveSnap`); when absent — canvas edge/centre lines — it spans the
  // whole canvas.
  from?: number;
  to?: number;
}

// The ids of every node related by ancestry to any moving node — the moving
// nodes themselves, their descendants (which drag along) and their ancestors
// (which wrap them). None are valid snap targets while that set is dragging.
// Pure so it can be unit-tested without a store/DOM; compares materialised paths.
export function relatedIds(
  nodes: { id: string; path: string }[],
  movingIds: string[],
): Set<string> {
  const moving = new Set(movingIds);
  const movingPaths = nodes.filter((n) => moving.has(n.id)).map((n) => n.path);
  const out = new Set<string>();

  for (const n of nodes) {
    const related = movingPaths.some(
      (mp) =>
        isSelfOrDescendantPath(n.path, mp) || isDescendantPath(mp, n.path),
    );

    if (related) out.add(n.id);
  }

  return out;
}

export function snapCandidates(
  others: Rect[],
  canvas: { width: number; height: number },
): SnapLine[] {
  const lines: SnapLine[] = [
    { axis: "x", pos: 0 },
    { axis: "x", pos: canvas.width / 2 },
    { axis: "x", pos: canvas.width },
    { axis: "y", pos: 0 },
    { axis: "y", pos: canvas.height / 2 },
    { axis: "y", pos: canvas.height },
  ];
  for (const b of others) {
    // For a vertical (axis "x") line the perpendicular extent is the box's
    // y-range; for a horizontal (axis "y") line it is the x-range.
    const yFrom = b.top;
    const yTo = b.top + b.height;
    const xFrom = b.left;
    const xTo = b.left + b.width;
    lines.push(
      { axis: "x", pos: b.left, from: yFrom, to: yTo },
      { axis: "x", pos: b.left + b.width / 2, from: yFrom, to: yTo },
      { axis: "x", pos: b.left + b.width, from: yFrom, to: yTo },
      { axis: "y", pos: b.top, from: xFrom, to: xTo },
      { axis: "y", pos: b.top + b.height / 2, from: xFrom, to: xTo },
      { axis: "y", pos: b.top + b.height, from: xFrom, to: xTo },
    );
  }
  return lines;
}

export function resolveSnap(
  box: Rect,
  candidates: SnapLine[],
  threshold: number,
): { left: number; top: number; matched: SnapLine[] } {
  const matched: SnapLine[] = [];
  // Per axis, the box exposes three probes (near edge, centre, far edge). Take
  // the smallest in-threshold correction across all probes.
  const probe = (axis: "x" | "y") => {
    const start = axis === "x" ? box.left : box.top;
    const size = axis === "x" ? box.width : box.height;
    const points = [start, start + size / 2, start + size];
    let best: { delta: number; line: SnapLine } | null = null;
    for (const line of candidates) {
      if (line.axis !== axis) continue;
      for (const p of points) {
        const delta = line.pos - p;
        if (Math.abs(delta) < threshold) {
          if (!best || Math.abs(delta) < Math.abs(best.delta))
            best = { delta, line };
        }
      }
    }
    return best;
  };

  // Grow the matched line's span so it reaches across both the source element
  // and the moving box. Canvas lines (no `from`/`to`) keep spanning the canvas.
  const segment = (line: SnapLine, axis: "x" | "y"): SnapLine => {
    if (line.from == null || line.to == null) return line;
    const movStart = axis === "x" ? box.top : box.left;
    const movEnd = movStart + (axis === "x" ? box.height : box.width);
    return {
      ...line,
      from: Math.min(line.from, movStart),
      to: Math.max(line.to, movEnd),
    };
  };

  const bx = probe("x");
  const by = probe("y");
  if (bx) matched.push(segment(bx.line, "x"));
  if (by) matched.push(segment(by.line, "y"));
  return {
    left: box.left + (bx?.delta ?? 0),
    top: box.top + (by?.delta ?? 0),
    matched,
  };
}

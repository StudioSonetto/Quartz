export interface SnapLine {
  axis: "x" | "y";
  pos: number;
  from?: number;
  to?: number;
}

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

export function snapValue(
  value: number,
  axis: "x" | "y",
  candidates: SnapLine[],
  threshold: number,
): { value: number; line: SnapLine | null } {
  let best: { delta: number; line: SnapLine } | null = null;

  for (const line of candidates) {
    if (line.axis !== axis) continue;

    const delta = line.pos - value;

    if (
      Math.abs(delta) < threshold &&
      (!best || Math.abs(delta) < Math.abs(best.delta))
    )
      best = { delta, line };
  }

  return { value: value + (best?.delta ?? 0), line: best?.line ?? null };
}

export function extendLine(
  line: SnapLine,
  axis: "x" | "y",
  box: Rect,
): SnapLine {
  if (line.from == null || line.to == null) return line;

  const start = axis === "x" ? box.top : box.left;
  const end = start + (axis === "x" ? box.height : box.width);

  return {
    ...line,
    from: Math.min(line.from, start),
    to: Math.max(line.to, end),
  };
}

export function resolveSnap(
  box: Rect,
  candidates: SnapLine[],
  threshold: number,
): { left: number; top: number; matched: SnapLine[] } {
  const matched: SnapLine[] = [];

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

  const segment = (line: SnapLine, axis: "x" | "y") =>
    extendLine(line, axis, box);

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

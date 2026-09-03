export const SHAPE_KINDS = ["rect", "ellipse", "line", "polygon"] as const;

export type ShapeKind = (typeof SHAPE_KINDS)[number] | "path";

const round = (n: number) => Math.round(n * 1000) / 1000;

function rect(w: number, h: number, radius: number) {
  const r = Math.min(radius, w / 2, h / 2);

  if (r <= 0) return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;

  const a = `A ${round(r)} ${round(r)} 0 0 1`;

  return [
    `M ${round(r)} 0`,
    `L ${round(w - r)} 0`,
    `${a} ${w} ${round(r)}`,
    `L ${w} ${round(h - r)}`,
    `${a} ${round(w - r)} ${h}`,
    `L ${round(r)} ${h}`,
    `${a} 0 ${round(h - r)}`,
    `L 0 ${round(r)}`,
    `${a} ${round(r)} 0`,
    "Z",
  ].join(" ");
}

function ellipse(w: number, h: number) {
  const rx = round(w / 2);
  const ry = round(h / 2);

  return `M 0 ${ry} A ${rx} ${ry} 0 1 0 ${w} ${ry} A ${rx} ${ry} 0 1 0 0 ${ry} Z`;
}

function polygonPoints(w: number, h: number, sides: number) {
  const n = Math.min(64, Math.max(3, Math.floor(sides) || 3));
  const unit = Array.from({ length: n }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;

    return { x: Math.cos(angle), y: Math.sin(angle) };
  });

  const minX = Math.min(...unit.map((p) => p.x));
  const maxX = Math.max(...unit.map((p) => p.x));
  const minY = Math.min(...unit.map((p) => p.y));
  const maxY = Math.max(...unit.map((p) => p.y));

  return unit.map((p) => ({
    x: round(((p.x - minX) / (maxX - minX)) * w),
    y: round(((p.y - minY) / (maxY - minY)) * h),
  }));
}

function polygon(w: number, h: number, sides: number) {
  const points = polygonPoints(w, h, sides).map((p) => `${p.x} ${p.y}`);

  return `M ${points[0]} ${points
    .slice(1)
    .map((p) => `L ${p}`)
    .join(" ")} Z`;
}

export function parametricPath(
  kind: ShapeKind,
  width: number,
  height: number,
  radius: number,
  sides: number,
): string {
  if (kind === "path") return "";

  // A line is the one kind that stays drawable when an axis collapses.
  if (kind === "line")
    return width > 0 || height > 0 ? `M 0 0 L ${width} ${height}` : "";

  if (width <= 0 || height <= 0) return "";

  if (kind === "rect") return rect(width, height, radius);
  if (kind === "ellipse") return ellipse(width, height);

  return polygon(width, height, sides);
}

export type Point = {
  x: number;
  y: number;
  in?: { x: number; y: number };
  out?: { x: number; y: number };
  mode: "corner" | "mirror" | "free";
};

const arm = (p: Point, key: "in" | "out") => ({
  x: p.x + (p[key]?.x ?? 0),
  y: p.y + (p[key]?.y ?? 0),
});

function segment(from: Point, to: Point) {
  if (!from.out && !to.in) return `L ${round(to.x)} ${round(to.y)}`;

  const c1 = arm(from, "out");
  const c2 = arm(to, "in");

  return `C ${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(to.x)} ${round(to.y)}`;
}

export function pointsToPath(points: Point[], closed: boolean): string {
  if (points.length < 2) return "";

  const first = points[0]!;
  const parts = [`M ${round(first.x)} ${round(first.y)}`];

  for (let i = 1; i < points.length; i++) {
    parts.push(segment(points[i - 1]!, points[i]!));
  }

  if (closed) {
    const last = points[points.length - 1]!;

    if (last.out || first.in) parts.push(segment(last, first));

    parts.push("Z");
  }

  return parts.join(" ");
}

export function pathBounds(points: Point[]) {
  if (!points.length) return { left: 0, top: 0, width: 0, height: 0 };

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  for (const p of points) {
    for (const { x, y } of [p, arm(p, "in"), arm(p, "out")]) {
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  return { left, top, width: right - left, height: bottom - top };
}

export function scalePoints(points: Point[], sx: number, sy: number): Point[] {
  const scaleArm = (a?: { x: number; y: number }) =>
    a ? { x: round(a.x * sx), y: round(a.y * sy) } : undefined;

  return points.map((p) => {
    const next: Point = {
      x: round(p.x * sx),
      y: round(p.y * sy),
      mode: p.mode,
    };

    if (p.in) next.in = scaleArm(p.in);
    if (p.out) next.out = scaleArm(p.out);

    return next;
  });
}

export function refitPoints(points: Point[]) {
  const { left, top } = pathBounds(points);

  if (!left && !top) return { points, dx: 0, dy: 0 };

  return {
    points: points.map((p) => ({
      ...p,
      x: round(p.x - left),
      y: round(p.y - top),
    })),
    dx: left,
    dy: top,
  };
}

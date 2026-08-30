export type ShapeKind = "rect" | "ellipse" | "line" | "polygon" | "path";

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

function polygon(w: number, h: number, sides: number) {
  const n = Math.min(64, Math.max(3, Math.floor(sides) || 3));
  const unit = Array.from({ length: n }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;

    return { x: Math.cos(angle), y: Math.sin(angle) };
  });

  const minX = Math.min(...unit.map((p) => p.x));
  const maxX = Math.max(...unit.map((p) => p.x));
  const minY = Math.min(...unit.map((p) => p.y));
  const maxY = Math.max(...unit.map((p) => p.y));

  const points = unit.map((p) => {
    const x = round(((p.x - minX) / (maxX - minX)) * w);
    const y = round(((p.y - minY) / (maxY - minY)) * h);

    return `${x} ${y}`;
  });

  return `M ${points[0]} ${points.slice(1).map((p) => `L ${p}`).join(" ")} Z`;
}

export function parametricPath(
  kind: ShapeKind,
  width: number,
  height: number,
  radius: number,
  sides: number,
): string {
  if (kind === "path" || width <= 0 || height <= 0) return "";

  if (kind === "rect") return rect(width, height, radius);
  if (kind === "ellipse") return ellipse(width, height);
  if (kind === "line") return `M 0 0 L ${width} ${height}`;

  return polygon(width, height, sides);
}

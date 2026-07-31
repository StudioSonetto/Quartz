import type { Tree } from "#shared/types";
import { isDescendantPath } from "~/utils/nodePath";

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function rangeIds(
  orderedIds: string[],
  anchorId: string,
  targetId: string,
): string[] {
  const a = orderedIds.indexOf(anchorId);
  const b = orderedIds.indexOf(targetId);

  if (a === -1 || b === -1) return [];

  const [lo, hi] = a <= b ? [a, b] : [b, a];

  return orderedIds.slice(lo, hi + 1);
}

export function outermostNodes(nodes: Tree[]): Tree[] {
  const paths = new Set(nodes.map((n) => n.path));

  return nodes.filter((n) => {
    for (const p of paths) {
      if (isDescendantPath(n.path, p)) return false;
    }

    return true;
  });
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

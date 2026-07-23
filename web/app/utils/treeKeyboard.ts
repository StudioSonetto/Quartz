import type { Tree } from "#shared/types";
import { wrapIndex } from "~/utils/dom";

export type TreeKey =
  | "Tab" | "ShiftTab"
  | "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
  | "Enter" | "Escape";

export type TreeKeyIntent =
  | { type: "highlight"; id: string }
  | { type: "expand"; id: string }
  | { type: "collapse"; id: string }
  | { type: "select"; id: string }
  | { type: "release" };

export function normalizeTreeKey(e: KeyboardEvent): TreeKey | null {
  switch (e.key) {
    case "Tab":
      return e.shiftKey ? "ShiftTab" : "Tab";
    case "ArrowUp":
    case "ArrowDown":
    case "ArrowLeft":
    case "ArrowRight":
    case "Enter":
    case "Escape":
      return e.key;
    default:
      return null;
  }
}

export function resolveTreeKey(
  key: TreeKey,
  visible: Tree[],
  highlightedId: string | null,
  collapsedIds: Set<string>,
  selectedId: string | null = null,
): TreeKeyIntent | null {
  const n = visible.length;
  if (!n) return null;

  const idx = visible.findIndex((t) => t.id === highlightedId);
  const current = idx >= 0 ? visible[idx] : undefined;

  // Move the highlight one step in `dir`, wrapping at the ends and skipping the
  // selected node (its ring is hidden, so landing there looks like the cursor
  // vanished). Only one node is selectable, so at most one skip is ever needed.
  const step = (dir: 1 | -1): TreeKeyIntent => {
    let i = wrapIndex(idx, dir, n);
    if (visible[i]!.id === selectedId) i = wrapIndex(i, dir, n);
    return { type: "highlight", id: visible[i]!.id };
  };

  switch (key) {
    case "ArrowDown":
    case "Tab":
      return step(1);

    case "ArrowUp":
    case "ShiftTab":
      return step(-1);

    case "ArrowRight": {
      if (!current || current.children.length === 0) return null;
      if (collapsedIds.has(current.id)) return { type: "expand", id: current.id };
      return { type: "highlight", id: current.children[0]!.id };
    }

    case "ArrowLeft": {
      if (!current) return null;
      if (!current.parent) return null;
      if (current.children.length > 0 && !collapsedIds.has(current.id)) {
        return { type: "collapse", id: current.id };
      }
      return { type: "highlight", id: current.parent.id };
    }

    case "Enter":
      return highlightedId ? { type: "select", id: highlightedId } : null;

    case "Escape":
      return { type: "release" };
  }
}

import type { Rect } from "~/utils/selection";
import { ROOT_PATH } from "~/utils/nodePath";
import {
  snapCandidates,
  resolveSnap,
  relatedIds,
  type SnapLine,
} from "~/utils/snapping";
import { flattenTree } from "~/utils/tree";

export const snappingKey: InjectionKey<ReturnType<typeof useSnapping>> =
  Symbol("snapping");

// Drag-time snapping. Candidates are frozen once at `begin()` (positions of all
// OTHER nodes on the slide, in canvas units) so per-frame work is a cheap
// compare — no per-frame getBoundingClientRect over the whole tree.
export function useSnapping() {
  const deck = useDeckStore();
  const { currentTree } = storeToRefs(deck);
  const { canvasSize, snapThreshold } = storeToRefs(useAtelierStore());
  const { renderEl, scale } = useCanvasScale();

  const guides = ref<SnapLine[]>([]);
  let candidates: SnapLine[] = [];

  function begin(movingIds: string[]) {
    const container = renderEl();

    if (!container || !currentTree.value) {
      candidates = [];

      return;
    }

    const c = container.getBoundingClientRect();
    const s = scale();
    const nodes = flattenTree(currentTree.value);

    // A moving node drags its whole subtree with it, so neither its descendants
    // nor its ancestors (which wrap it) are valid snap targets — only unrelated
    // nodes and the canvas guides are.
    const excluded = relatedIds(nodes, movingIds);

    const others: Rect[] = [];

    for (const n of nodes) {
      if (n.path === ROOT_PATH || excluded.has(n.id)) continue;

      const el = document.getElementById(n.id);

      if (!el) continue;

      const r = el.getBoundingClientRect();

      if (r.width === 0 && r.height === 0) continue;

      others.push({
        left: (r.left - c.left) * s.x,
        top: (r.top - c.top) * s.y,
        width: r.width * s.x,
        height: r.height * s.y,
      });
    }

    candidates = snapCandidates(others, {
      width: canvasSize.value.width,
      height: canvasSize.value.height,
    });
  }

  // `box` is in canvas units. Returns the snapped top-left; updates `guides`.
  function apply(box: Rect): { left: number; top: number } {
    const { left, top, matched } = resolveSnap(
      box,
      candidates,
      snapThreshold.value,
    );

    guides.value = matched;

    return { left, top };
  }

  function end() {
    guides.value = [];
    candidates = [];
  }

  return { begin, apply, guides, end };
}

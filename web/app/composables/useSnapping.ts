export const snappingKey: InjectionKey<ReturnType<typeof useSnapping>> =
  Symbol("snapping");

export function useSnapping() {
  const deck = useDeckStore();
  const { currentTree } = storeToRefs(deck);
  const { canvasSize, snapThreshold } = storeToRefs(useAtelierStore());
  const { findRenderEl, scale } = useCanvasScale();

  const guides = ref<SnapLine[]>([]);
  let candidates: SnapLine[] = [];

  function begin(movingIds: string[]) {
    const container = findRenderEl();

    if (!container || !currentTree.value) {
      candidates = [];

      return;
    }

    const c = container.getBoundingClientRect();
    const s = scale();
    const nodes = flattenTree(currentTree.value);

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

  function apply(box: Rect): { left: number; top: number } {
    const { left, top, matched } = resolveSnap(
      box,
      candidates,
      snapThreshold.value,
    );

    guides.value = matched;

    return { left, top };
  }

  function applyEdges(
    edges: { x?: number; y?: number },
    box: Rect,
  ): { x?: number; y?: number } {
    const matched: SnapLine[] = [];
    const out: { x?: number; y?: number } = {};

    for (const axis of ["x", "y"] as const) {
      const value = edges[axis];

      if (value == null) continue;

      const hit = snapValue(value, axis, candidates, snapThreshold.value);

      out[axis] = hit.value;

      if (hit.line) matched.push(extendLine(hit.line, axis, box));
    }

    guides.value = matched;

    return out;
  }

  function end() {
    guides.value = [];
    candidates = [];
  }

  return { begin, apply, applyEdges, guides, end };
}

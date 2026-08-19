function isAlignable(node: Tree, comps: ReturnType<typeof useNodeComponents>) {
  if (isNodeLocked(node)) return false;

  const transform = comps.getNodeComponent(node.id, "core.transform");

  if (!transform) return false;

  if (anyBound(transform.data, ["position.x", "position.y"])) return false;
  if (comps.isGridChild(node)) return false;

  return true;
}

export function useAlignment() {
  const deck = useDeckStore();
  const { selectedNodes } = storeToRefs(deck);
  const { canvasSize } = storeToRefs(useAtelierStore());
  const comps = useNodeComponents();
  const { scale } = useCanvasScale();

  function rectsFor(nodes: Tree[]): NodeRect[] {
    const s = scale();

    return nodes.map((n) => {
      const data = comps.renderData(n, "core.transform")!;
      const el = document.getElementById(n.id);
      const measured = el?.getBoundingClientRect();
      return {
        id: n.id,
        left: data.position.x,
        top: data.position.y,
        width:
          typeof data.size?.width === "number"
            ? data.size.width
            : (measured?.width ?? 0) * s.x,
        height:
          typeof data.size?.height === "number"
            ? data.size.height
            : (measured?.height ?? 0) * s.y,
      };
    });
  }

  const alignable = computed(() =>
    selectedNodes.value.filter((n) => isAlignable(n, comps)),
  );
  const canAlign = computed(() => alignable.value.length >= 1);
  const canDistribute = computed(() => alignable.value.length >= 3);

  function bbox(rects: NodeRect[]): Frame {
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.left + r.width));
    const bottom = Math.max(...rects.map((r) => r.top + r.height));

    return { left, top, width: right - left, height: bottom - top };
  }

  function apply(next: Record<string, { left: number; top: number }>) {
    for (const [id, pos] of Object.entries(next)) {
      const t = comps.getNodeComponent(id, "core.transform");

      if (!t) continue;

      t.data.position.x = pos.left;
      t.data.position.y = pos.top;

      deck.updateComponent(t);
    }
  }

  function align(op: AlignOp) {
    const rects = rectsFor(alignable.value);

    if (!rects.length) return;

    const frame =
      rects.length >= 2
        ? bbox(rects)
        : {
            left: 0,
            top: 0,
            width: canvasSize.value.width,
            height: canvasSize.value.height,
          };

    apply(alignPositions(rects, op, frame));
  }

  function distribute(axis: "h" | "v") {
    const rects = rectsFor(alignable.value);

    if (rects.length < 3) return;

    apply(distributePositions(rects, axis));
  }

  return { align, distribute, canAlign, canDistribute };
}

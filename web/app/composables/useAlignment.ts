function isAlignable(node: Tree, comps: ReturnType<typeof useNodeComponents>) {
  if (isNodeLocked(node)) return false;

  const transform = comps.getNodeComponent(node.id, "core.transform");

  if (!transform) return false;

  if (anyBound(transform.data, ["position.x", "position.y"])) return false;
  if (comps.isGridChild(node)) return false;

  if (
    getNodeType(node.type)?.sizing === "derived" &&
    comps.renderData(node, "core.layout").mode !== "grid"
  )
    return false;

  return true;
}

export function alignableNodes(nodes: Tree[]): Tree[] {
  const comps = useNodeComponents();

  return nodes.filter((n) => isAlignable(n, comps));
}

type Offsets = Map<string, { x: number; y: number }>;

export function useAlignment() {
  const deck = useDeckStore();
  const { selectedNodes } = storeToRefs(deck);
  const { canvasSize } = storeToRefs(useAtelierStore());
  const comps = useNodeComponents();
  const { scale } = useCanvasScale();

  function offsetsFor(nodes: Tree[]): Offsets {
    return new Map(nodes.map((n) => [n.id, comps.groupOffset(n)]));
  }

  function rectsFor(nodes: Tree[], offsets: Offsets): NodeRect[] {
    const s = scale();

    return nodes.map((n) => {
      const data = comps.renderData(n, "core.transform");
      const el = document.getElementById(n.id);
      const measured = el?.getBoundingClientRect();
      const offset = offsets.get(n.id)!;

      return {
        id: n.id,
        left: data.position.x + offset.x,
        top: data.position.y + offset.y,
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

  const alignable = computed(() => alignableNodes(selectedNodes.value));
  const canAlign = computed(() => alignable.value.length >= 1);
  const canDistribute = computed(() => alignable.value.length >= 3);

  function bbox(rects: NodeRect[]): Frame {
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.left + r.width));
    const bottom = Math.max(...rects.map((r) => r.top + r.height));

    return { left, top, width: right - left, height: bottom - top };
  }

  function apply(
    next: Record<string, { left: number; top: number }>,
    offsets: Offsets,
  ) {
    for (const [id, pos] of Object.entries(next)) {
      const t = comps.getNodeComponent(id, "core.transform");
      const offset = offsets.get(id);

      if (!t || !offset) continue;

      t.data.position.x = pos.left - offset.x;
      t.data.position.y = pos.top - offset.y;

      deck.updateComponent(t);
    }
  }

  function align(op: AlignOp) {
    const offsets = offsetsFor(alignable.value);
    const rects = rectsFor(alignable.value, offsets);

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

    apply(alignPositions(rects, op, frame), offsets);
  }

  function distribute(axis: "h" | "v") {
    const offsets = offsetsFor(alignable.value);
    const rects = rectsFor(alignable.value, offsets);

    if (rects.length < 3) return;

    apply(distributePositions(rects, axis), offsets);
  }

  return { align, distribute, canAlign, canDistribute };
}

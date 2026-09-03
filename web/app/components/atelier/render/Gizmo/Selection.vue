<template>
  <div
    v-if="box"
    data-html2canvas-ignore
    class="selection"
    :style="{
      left: `${box.left}px`,
      top: `${box.top}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    }"
    @pointerdown.stop.prevent="startMove"
  ></div>
</template>

<style scoped lang="postcss">
.selection {
  @apply absolute z-45 outline outline-2 outline-accent;
  @apply cursor-move;
}
</style>

<script setup lang="ts">
const deck = useDeckStore();
const { selectedNodes, unlockedSelection } = storeToRefs(deck);
const comps = useNodeComponents();
const { scale } = useCanvasScale();
const snapping = inject(snappingKey)!;
const { arm } = useSuppressClickAfterDrag();

const movable = computed(() =>
  outermostNodes(
    unlockedSelection.value.filter((n) => {
      const transform = comps.getNodeComponent(n.id, "core.transform");

      if (!transform || anyBound(transform.data, ["position.x", "position.y"]))
        return false;

      return !comps.isGridChild(n);
    }),
  ),
);

const { rects } = inject(nodeRectsKey)!;

const box = computed<Rect | null>(() => {
  if (selectedNodes.value.length < 2) return null;

  const boxes = selectedNodes.value
    .map((n) => rects.value.get(n.id))
    .filter((r) => !!r);

  if (!boxes.length) return null;

  const left = Math.min(...boxes.map((r) => r.left));
  const top = Math.min(...boxes.map((r) => r.top));
  const right = Math.max(...boxes.map((r) => r.left + r.width));
  const bottom = Math.max(...boxes.map((r) => r.top + r.height));

  return { left, top, width: right - left, height: bottom - top };
});

type DragEntry = {
  t: NonNullable<ReturnType<typeof comps.getNodeComponent>>;
  x: number;
  y: number;
};

type DragState = {
  startX: number;
  startY: number;
  starts: Map<string, DragEntry>;
  union: Rect;
  s: { x: number; y: number };
};

const move = useHistoryGesture("Move");

let drag: DragState | null = null;
let moveRaf = 0;
let latest: PointerEvent | null = null;

function startMove(e: PointerEvent) {
  const nodes = movable.value;

  if (!nodes.length || !box.value) return;

  move.start();

  const s = scale();
  const starts = new Map<string, DragEntry>();

  for (const n of nodes) {
    const t = comps.getNodeComponent(n.id, "core.transform")!;

    starts.set(n.id, { t, x: t.data.position.x, y: t.data.position.y });
  }

  drag = {
    startX: e.clientX,
    startY: e.clientY,
    starts,
    union: {
      left: box.value.left * s.x,
      top: box.value.top * s.y,
      width: box.value.width * s.x,
      height: box.value.height * s.y,
    },
    s,
  };

  snapping.begin(nodes.map((n) => n.id));
}

function flushMove() {
  moveRaf = 0;

  if (!drag || !latest) return;

  const dxRaw = (latest.clientX - drag.startX) * drag.s.x;
  const dyRaw = (latest.clientY - drag.startY) * drag.s.y;

  const snapped = snapping.apply({
    left: drag.union.left + dxRaw,
    top: drag.union.top + dyRaw,
    width: drag.union.width,
    height: drag.union.height,
  });

  const dx = snapped.left - drag.union.left;
  const dy = snapped.top - drag.union.top;

  for (const entry of drag.starts.values()) {
    entry.t.data.position.x = Math.round(entry.x + dx);
    entry.t.data.position.y = Math.round(entry.y + dy);
  }
}

useEventListener(window, "pointermove", (e: PointerEvent) => {
  if (!drag) return;

  latest = e;

  if (!moveRaf) moveRaf = requestAnimationFrame(flushMove);
});

useEventListener(window, ["pointerup", "pointercancel"], () => {
  if (!drag) return;

  if (moveRaf) cancelAnimationFrame(moveRaf);

  moveRaf = 0;
  latest = null;

  snapping.end();

  for (const entry of drag.starts.values()) {
    deck.updateComponent(entry.t);
  }

  move.stop();

  drag = null;

  arm();
});
</script>

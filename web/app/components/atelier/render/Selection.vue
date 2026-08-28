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
  @apply absolute z-45 outline outline-3 outline-solid outline-accent;
  @apply cursor-move;
}
</style>

<script setup lang="ts">
const deck = useDeckStore();
const { selectedNodes, unlockedSelection } = storeToRefs(deck);
const comps = useNodeComponents();
const { renderRoot, scale } = useCanvasScale();
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

const box = ref<Rect | null>(null);

function computeBox() {
  const container = renderRoot.value;

  if (!container || selectedNodes.value.length < 2) {
    box.value = null;

    return;
  }

  const c = container.getBoundingClientRect();
  let minL = Infinity,
    minT = Infinity,
    maxR = -Infinity,
    maxB = -Infinity;

  for (const n of selectedNodes.value) {
    const el = document.getElementById(n.id);

    if (!el) continue;

    const r = el.getBoundingClientRect();

    if (r.width === 0 && r.height === 0) continue;

    minL = Math.min(minL, r.left - c.left);
    minT = Math.min(minT, r.top - c.top);
    maxR = Math.max(maxR, r.right - c.left);
    maxB = Math.max(maxB, r.bottom - c.top);
  }

  box.value =
    minL === Infinity
      ? null
      : { left: minL, top: minT, width: maxR - minL, height: maxB - minT };
}

let rafId = 0;

function scheduleBox() {
  if (rafId) return;

  rafId = requestAnimationFrame(() => {
    rafId = 0;
    computeBox();
  });
}

useMutationObserver(renderRoot, scheduleBox, {
  subtree: true,
  attributes: true,
  attributeFilter: ["style"],
});
useResizeObserver(renderRoot, scheduleBox);
watch(selectedNodes, scheduleBox, { deep: false });
onMounted(() => nextTick(computeBox));
onUnmounted(() => rafId && cancelAnimationFrame(rafId));

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

let drag: DragState | null = null;
let moveRaf = 0;
let latest: PointerEvent | null = null;

function startMove(e: PointerEvent) {
  const nodes = movable.value;

  if (!nodes.length || !box.value) return;

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

useEventListener(window, "pointerup", () => {
  if (!drag) return;

  if (moveRaf) cancelAnimationFrame(moveRaf);

  moveRaf = 0;
  latest = null;

  snapping.end();

  for (const entry of drag.starts.values()) {
    deck.updateComponent(entry.t);
  }

  drag = null;

  arm();
});
</script>

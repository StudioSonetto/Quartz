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
  @apply absolute z-45 outline outline-1 outline-dashed outline-accent;
  @apply cursor-move;
}
</style>

<script setup lang="ts">
import type { Rect } from "~/utils/selection";
import { snappingKey } from "~/composables/useSnapping";

const deck = useDeckStore();
const { selectedNodes } = storeToRefs(deck);
const comps = useNodeComponents();
const { renderEl, scale } = useCanvasScale();
const snapping = inject(snappingKey)!;
const { arm } = useSuppressClickAfterDrag();

// Movable = selected leaves/groups with a canvas-space core.transform.
const movable = computed(() =>
  selectedNodes.value.filter(
    (n) =>
      comps.getNodeComponent(n.id, "core.transform") && !comps.isGridChild(n),
  ),
);

const box = ref<Rect | null>(null);

function computeBox() {
  const container = renderEl();

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

// The box tracks the selection live: node style mutations (incl. a drag in
// progress), container resize, and selection changes all schedule a recompute
// through the same rAF gate.
useMutationObserver(renderEl, scheduleBox, {
  subtree: true,
  attributes: true,
  attributeFilter: ["style"],
});
useResizeObserver(renderEl, scheduleBox);
watch(selectedNodes, scheduleBox, { deep: false });
onMounted(() => nextTick(computeBox));
onUnmounted(() => rafId && cancelAnimationFrame(rafId));

// One entry per moving node: its transform component (cached at drag-start so
// the per-frame loop never re-scans the component list) + its start position.
type DragEntry = {
  t: NonNullable<ReturnType<typeof comps.getNodeComponent>>;
  x: number;
  y: number;
};

type DragState = {
  startX: number;
  startY: number;
  starts: Map<string, DragEntry>;
  // Union box of the moving set in canvas units, snapped as one.
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
  let left = Infinity,
    top = Infinity;

  for (const n of nodes) {
    const t = comps.getNodeComponent(n.id, "core.transform")!;

    starts.set(n.id, { t, x: t.data.position.x, y: t.data.position.y });
    left = Math.min(left, t.data.position.x);
    top = Math.min(top, t.data.position.y);
  }

  drag = {
    startX: e.clientX,
    startY: e.clientY,
    starts,
    union: {
      left,
      top,
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

  // Snap the union box, derive the applied delta from the snap correction.
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
  // The box follows via the style MutationObserver above — no manual recompute.
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

  // Swallow the synthetic post-drag click so `.render`'s @click doesn't clear
  // the multi-selection we just moved.
  arm();
});
</script>

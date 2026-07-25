<template>
  <div
    v-if="box"
    class="handles"
    :style="{
      left: `${box.left}px`,
      top: `${box.top}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    }"
  >
    <div
      v-for="h in resizeHandles"
      :key="h.pos"
      class="handle"
      :class="`h-${h.pos}`"
      @pointerdown.stop.prevent="startResize(h, $event)"
    ></div>
    <div
      class="handle rotate"
      @pointerdown.stop.prevent="startRotate($event)"
    ></div>
  </div>
</template>

<style scoped lang="postcss">
.handles {
  @apply absolute z-50 pointer-events-none;
  @apply outline outline-1 outline-accent;

  .handle {
    @apply absolute w-2.5 h-2.5 bg-light-200 outline outline-1 outline-accent;
    @apply pointer-events-auto -translate-x-1/2 -translate-y-1/2;
  }

  .h-nw {
    left: 0;
    top: 0;
  }

  .h-n {
    left: 50%;
    top: 0;
  }

  .h-ne {
    left: 100%;
    top: 0;
  }

  .h-e {
    left: 100%;
    top: 50%;
  }

  .h-se {
    left: 100%;
    top: 100%;
  }
  .h-s {
    left: 50%;
    top: 100%;
  }

  .h-sw {
    left: 0;
    top: 100%;
  }

  .h-w {
    left: 0;
    top: 50%;
  }

  .rotate {
    left: 50%;
    top: -24px;
    @apply rounded-full;
  }
}
</style>

<script setup lang="ts">
type Pos = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const resizeHandles: { pos: Pos; dx: number; dy: number }[] = [
  { pos: "nw", dx: -1, dy: -1 },
  { pos: "n", dx: 0, dy: -1 },
  { pos: "ne", dx: 1, dy: -1 },
  { pos: "e", dx: 1, dy: 0 },
  { pos: "se", dx: 1, dy: 1 },
  { pos: "s", dx: 0, dy: 1 },
  { pos: "sw", dx: -1, dy: 1 },
  { pos: "w", dx: -1, dy: 0 },
];

const { selectedNode } = storeToRefs(useDeckStore());
const { updateComponent } = useDeckStore();
const { getNodeComponent } = useNodeComponents();
const { renderEl, scale } = useCanvasScale();

const box = ref<{
  left: number;
  top: number;
  width: number;
  height: number;
} | null>(null);

function computeBox() {
  const node = selectedNode.value;

  if (!node || node.path === "root") {
    box.value = null;

    return;
  }

  const el = document.getElementById(node.id);
  const container = renderEl();

  if (!el || !container) {
    box.value = null;

    return;
  }

  const r = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();

  box.value = {
    left: r.left - c.left,
    top: r.top - c.top,
    width: r.width,
    height: r.height,
  };
}

// The selected element's box only moves when its own style/size changes (drag,
// nudge, resize) or the render container resizes; observe those and coalesce
// bursts into one recompute per frame, rather than polling every frame forever.
let rafId = 0;

function scheduleBounds() {
  if (rafId) return;

  rafId = requestAnimationFrame(() => {
    rafId = 0;
    computeBox();
  });
}

useMutationObserver(renderEl, scheduleBounds, {
  subtree: true,
  attributes: true,
  attributeFilter: ["style"],
  characterData: true,
});

useResizeObserver(renderEl, scheduleBounds);

watch(selectedNode, () => nextTick(computeBox));

onMounted(() => nextTick(computeBox));

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);

  activeDrag?.();
});

function transformOf(node: Tree) {
  return getNodeComponent(node.id, "core.transform");
}

let activeDrag: (() => void) | null = null;

function startPointerDrag(onMove: (ev: PointerEvent) => void) {
  let raf = 0;
  let latest: PointerEvent | null = null;

  function flush() {
    raf = 0;

    if (latest) onMove(latest);
  }

  function move(ev: PointerEvent) {
    latest = ev;

    if (!raf) raf = requestAnimationFrame(flush);
  }

  let trackRaf = requestAnimationFrame(function track() {
    computeBox();

    trackRaf = requestAnimationFrame(track);
  });

  function up() {
    if (raf) cancelAnimationFrame(raf);

    cancelAnimationFrame(trackRaf);

    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);

    const swallowClick = (ev: MouseEvent) => ev.stopPropagation();

    window.addEventListener("click", swallowClick, {
      capture: true,
      once: true,
    });
    setTimeout(
      () =>
        window.removeEventListener("click", swallowClick, { capture: true }),
      0,
    );

    activeDrag = null;
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);

  activeDrag = up;
}

function startResize(h: { dx: number; dy: number }, e: PointerEvent) {
  const node = selectedNode.value;

  if (!node) return;

  const transform = transformOf(node);

  if (!transform) return;

  const el = document.getElementById(node.id);

  if (!el) return;

  const s = scale();
  const u = transform.data.scale || 1;
  const rad = ((transform.data.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const startW = el.offsetWidth;
  const startH = el.offsetHeight;
  const startX = e.clientX;
  const startY = e.clientY;

  const wc0 = startW * u;
  const hc0 = startH * u;

  const ax = (-h.dx * wc0) / 2;
  const ay = (-h.dy * hc0) / 2;
  const anchorX = transform.data.position.x + wc0 / 2 + (ax * cos - ay * sin);
  const anchorY = transform.data.position.y + hc0 / 2 + (ax * sin + ay * cos);

  startPointerDrag((ev) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;

    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;

    const sizeW =
      h.dx !== 0
        ? Math.max(1, Math.round(startW + (localX * h.dx * s.x) / u))
        : startW;
    const sizeH =
      h.dy !== 0
        ? Math.max(1, Math.round(startH + (localY * h.dy * s.x) / u))
        : startH;

    const wc = sizeW * u;
    const hc = sizeH * u;

    const nax = (-h.dx * wc) / 2;
    const nay = (-h.dy * hc) / 2;
    const cx = anchorX - (nax * cos - nay * sin);
    const cy = anchorY - (nax * sin + nay * cos);

    if (h.dx !== 0) transform.data.size.width = sizeW;
    if (h.dy !== 0) transform.data.size.height = sizeH;

    transform.data.position.x = Math.round(cx - wc / 2);
    transform.data.position.y = Math.round(cy - hc / 2);

    updateComponent(transform);
  });
}

function startRotate(e: PointerEvent) {
  const node = selectedNode.value;

  if (!node) return;

  const transform = transformOf(node);

  if (!transform) return;

  const rect = document.getElementById(node.id)!.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
  const startRotation = transform.data.rotation ?? 0;

  startPointerDrag((ev) => {
    const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx);
    const deg = ((angle - startAngle) * 180) / Math.PI;

    transform.data.rotation = Math.round(startRotation + deg);

    updateComponent(transform);
  });
}
</script>

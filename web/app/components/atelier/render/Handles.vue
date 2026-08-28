<template>
  <div
    v-if="box"
    data-html2canvas-ignore
    class="handles"
    :style="{
      left: `${box.left}px`,
      top: `${box.top}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    }"
  >
    <template v-if="canResize">
      <div
        v-for="h in resizeHandles"
        :key="h.pos"
        class="handle"
        :class="`h-${h.pos}`"
        @pointerdown.stop.prevent="startResize(h, $event)"
      ></div>
    </template>
    <div
      v-if="canRotate"
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
    @apply left-0 top-0;
  }

  .h-n {
    @apply left-1/2 top-0;
  }

  .h-ne {
    @apply left-full top-0;
  }

  .h-e {
    @apply left-full top-1/2;
  }

  .h-se {
    @apply left-full top-full;
  }

  .h-s {
    @apply left-1/2 top-full;
  }

  .h-sw {
    @apply left-0 top-full;
  }

  .h-w {
    @apply left-0 top-1/2;
  }

  .rotate {
    @apply left-1/2 -top-6 rounded-full;
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

const RESIZE_WRITES = [
  "size.width",
  "size.height",
  "position.x",
  "position.y",
] as const;

const { soleSelected } = storeToRefs(useDeckStore());
const { updateComponent } = useDeckStore();
const { getNodeComponent, renderData } = useNodeComponents();
const { renderRoot, scale } = useCanvasScale();

const box = ref<Rect | null>(null);

function computeBox() {
  const node = soleSelected.value;

  if (!node || node.path === "root") {
    box.value = null;

    return;
  }

  const el = document.getElementById(node.id);
  const container = renderRoot.value;

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

let rafId = 0;

function scheduleBounds() {
  if (rafId) return;

  rafId = requestAnimationFrame(() => {
    rafId = 0;
    computeBox();
  });
}

useMutationObserver(renderRoot, scheduleBounds, {
  subtree: true,
  attributes: true,
  attributeFilter: ["style"],
  characterData: true,
});

useResizeObserver(renderRoot, scheduleBounds);

watch(soleSelected, () => nextTick(computeBox));

onMounted(() => nextTick(computeBox));

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);

  activeDrag?.();
});

function transformOf(node: Tree) {
  return getNodeComponent(node.id, "core.transform");
}

const selectedTransform = computed(() => {
  const node = soleSelected.value;

  return node ? transformOf(node)?.data : undefined;
});

const handles = computed(() => {
  const node = soleSelected.value;

  return node ? getNodeType(node.type)?.handles : undefined;
});

const locked = computed(() => isNodeLocked(soleSelected.value));

const canResize = computed(() => {
  if (locked.value) return false;

  if (handles.value?.resize) return true;

  const node = soleSelected.value;

  if (node && getNodeType(node.type)?.sizing === "derived") return false;

  const data = selectedTransform.value;

  return !!data && !anyBound(data, RESIZE_WRITES);
});

const canRotate = computed(() => {
  if (locked.value) return false;

  if (handles.value?.rotate) return true;

  const data = selectedTransform.value;

  return !!data && !isBound(data, "rotation");
});

let activeDrag: (() => void) | null = null;

function startPointerDrag(
  onMove: (ev: PointerEvent) => void,
  onEnd?: () => void,
) {
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

    onEnd?.();

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
  const node = soleSelected.value;

  if (!node) return;

  if (handles.value?.resize) {
    if (!box.value) return;

    const gesture = handles.value.resize(
      node,
      { x: h.dx, y: h.dy },
      { ...box.value },
    );

    if (!gesture) return;

    const originX = e.clientX;
    const originY = e.clientY;

    return startPointerDrag(
      (ev) => gesture.move(ev.clientX - originX, ev.clientY - originY),
      () => gesture.end?.(),
    );
  }

  const transform = transformOf(node);

  if (!transform) return;

  if (anyBound(transform.data, RESIZE_WRITES)) return;

  const el = document.getElementById(node.id);

  if (!el) return;

  const drawn = renderData(node, "core.transform");

  const s = scale();
  const u = drawn.scale || 1;
  const rad = ((drawn.rotation ?? 0) * Math.PI) / 180;
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
  const anchorX = drawn.position.x + wc0 / 2 + (ax * cos - ay * sin);
  const anchorY = drawn.position.y + hc0 / 2 + (ax * sin + ay * cos);

  startPointerDrag((ev) => {
    const dx = (ev.clientX - startX) * s.x;
    const dy = (ev.clientY - startY) * s.y;

    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;

    const sizeW =
      h.dx !== 0
        ? Math.max(1, Math.round(startW + (localX * h.dx) / u))
        : startW;
    const sizeH =
      h.dy !== 0
        ? Math.max(1, Math.round(startH + (localY * h.dy) / u))
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
  const node = soleSelected.value;

  if (!node) return;

  const element = document.getElementById(node.id);

  if (!element) return;

  const rect = element.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);

  const degreesFrom = (ev: PointerEvent) =>
    ((Math.atan2(ev.clientY - cy, ev.clientX - cx) - startAngle) * 180) /
    Math.PI;

  if (handles.value?.rotate) {
    const gesture = handles.value.rotate(node);

    if (!gesture) return;

    return startPointerDrag(
      (ev) => gesture.move(degreesFrom(ev)),
      () => gesture.end?.(),
    );
  }

  const transform = transformOf(node);

  if (!transform) return;

  if (isBound(transform.data, "rotation")) return;

  const startRotation = transform.data.rotation ?? 0;

  startPointerDrag((ev) => {
    transform.data.rotation = Math.round(startRotation + degreesFrom(ev));

    updateComponent(transform);
  });
}
</script>

<template>
  <div
    data-html2canvas-ignore
    class="marquee-detector"
    @pointerdown="onDown"
  ></div>
  <div
    v-if="rect"
    data-html2canvas-ignore
    class="marquee"
    :style="rectStyle"
  ></div>
</template>

<style scoped lang="postcss">
.marquee-detector {
  @apply absolute inset-0 touch-none;
}

.marquee {
  @apply absolute z-50;
  @apply border-solid border-1 border-accent bg-accent/10;
}
</style>

<script setup lang="ts">
import { flattenTree } from "~/utils/tree";
import { ROOT_PATH } from "~/utils/nodePath";
import { rectsIntersect, type Rect } from "~/utils/selection";

const deck = useDeckStore();
const { currentTree } = storeToRefs(deck);

const { renderEl } = useCanvasScale();
const { extendSelection, clear } = useNodeSelection();
const { arm } = useSuppressClickAfterDrag();

const rect = ref<Rect | null>(null);
const rectStyle = computed(() =>
  rect.value
    ? {
        left: `${rect.value.left}px`,
        top: `${rect.value.top}px`,
        width: `${rect.value.width}px`,
        height: `${rect.value.height}px`,
      }
    : {},
);

let origin: { x: number; y: number; c: DOMRect; additive: boolean } | null =
  null;
let moved = false;

function onDown(e: PointerEvent) {
  const container = renderEl();

  if (!container) return;

  const c = container.getBoundingClientRect();

  origin = {
    x: e.clientX - c.left,
    y: e.clientY - c.top,
    c,
    additive: e.shiftKey,
  };

  moved = false;
}

useEventListener(window, "pointermove", (e: PointerEvent) => {
  if (!origin) return;

  const x = e.clientX - origin.c.left;
  const y = e.clientY - origin.c.top;

  rect.value = {
    left: Math.min(origin.x, x),
    top: Math.min(origin.y, y),
    width: Math.abs(x - origin.x),
    height: Math.abs(y - origin.y),
  };

  if (rect.value.width > 3 || rect.value.height > 3) moved = true;
});

useEventListener(window, "pointerup", () => {
  if (!origin) return;

  if (moved && rect.value && currentTree.value) {
    const box = rect.value;
    const { c } = origin;
    const hits = flattenTree(currentTree.value).filter((n) => {
      if (n.path === ROOT_PATH) return false;

      const el = document.getElementById(n.id);

      if (!el) return false;

      const r = el.getBoundingClientRect();
      const nb: Rect = {
        left: r.left - c.left,
        top: r.top - c.top,
        width: r.width,
        height: r.height,
      };

      return rectsIntersect(box, nb);
    });

    if (!origin.additive) clear();

    extendSelection(hits);
  }

  // A marquee drag leaves a synthetic click on `.render` that would clear the
  // just-made selection; swallow it. (A plain click still clears.)
  if (moved) arm();

  rect.value = null;
  origin = null;
});
</script>

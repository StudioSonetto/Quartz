<template>
  <Transition name="fade-fast">
    <div
      v-if="box"
      data-html2canvas-ignore
      ref="selectionEl"
      class="selection"
      :style="{
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
      }"
      @pointerdown.stop.prevent="onPress"
      @wheel="forward"
    ></div>
  </Transition>
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

const selectionEl = useTemplateRef<HTMLElement>("selectionEl");
const drag = usePointerDrag();

function onPress(e: PointerEvent) {
  if (e.button !== 0) return forward(e);
  if (box.value && movable.value.length) startMove(e, box.value);
}

function navigable(el: Element) {
  const type = el.id && deck.getNodeAsTree(el.id)?.type;

  return !!type && !!getNodeType(type)?.navigate;
}

function forward(e: PointerEvent | WheelEvent) {
  if (isPointerDragging()) return;

  const stack = document.elementsFromPoint(e.clientX, e.clientY);
  let target = stack[stack.indexOf(selectionEl.value!) + 1] ?? null;

  while (target && !navigable(target)) target = target.parentElement;

  const copy = new (e.constructor as typeof PointerEvent)(e.type, e);

  if (target && !target.dispatchEvent(copy)) e.preventDefault();
}

function startMove(e: PointerEvent, from: Rect) {
  const nodes = movable.value;
  const s = scale();
  const starts = new Map<string, { x: number; y: number }>();

  for (const n of nodes) {
    const { position } = comps.renderData(n, "core.transform");

    starts.set(n.id, { x: position.x, y: position.y });
  }

  const union = {
    left: from.left * s.x,
    top: from.top * s.y,
    width: from.width * s.x,
    height: from.height * s.y,
  };

  drag.start(
    "Move",
    (ev) => {
      const snapped = snapping.apply({
        ...union,
        left: union.left + (ev.clientX - e.clientX) * s.x,
        top: union.top + (ev.clientY - e.clientY) * s.y,
      });

      const dx = snapped.left - union.left;
      const dy = snapped.top - union.top;

      for (const [id, start] of starts) {
        const t = comps.getNodeComponent(id, "core.transform");

        if (!t) continue;

        deck.updateComponent(
          withData(t, {
            position: {
              ...t.data.position,
              x: Math.round(start.x + dx),
              y: Math.round(start.y + dy),
            },
          }),
        );
      }
    },
    () => snapping.end(),
  );

  snapping.begin(nodes.map((n) => n.id));
}
</script>

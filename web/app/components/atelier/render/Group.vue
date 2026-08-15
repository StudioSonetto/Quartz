<template>
  <div class="contents" ref="container" @click="onClick" @mouseenter="onHover">
    <div
      v-if="!presenting"
      ref="border"
      :id="props.node.id"
      class="group-border"
      :class="[isSelected(props.node.id) ? 'outline-accent!' : '']"
      :style="borderStyle"
      :tabindex="0"
      @click="onSelect"
      @mousedown="onSelect"
      @click.right="clear"
      @keydown.esc="clear"
    ></div>
    <AtelierRenderElement
      v-for="child in props.node.children"
      :key="child.id"
      :node="child"
      :isLocked="props.isLocked"
    />
  </div>
</template>

<style scoped lang="postcss">
.group-border {
  @apply absolute transform-origin-top-left;
  @apply outline outline-3 outline-solid outline-accent/0 hover:outline-accent;
  @apply border-rd;
}
</style>

<script setup lang="ts">
const { isSelected, updateComponent } = useDeckStore();
const { getNodeComponent } = useNodeComponents();

const { setIsDragging } = useAtelierStore();

const presenting = inject(presentingKey, ref(false));
const { fire } = useEventDispatch();

const { canvasRect, renderRoot, scale } = useCanvasScale();
const { begin, apply, end } = inject(snappingKey)!;

const props = defineProps<{
  node: Tree;
  isLocked?: boolean;
}>();

const container = useTemplateRef<HTMLElement>("container");
const border = useTemplateRef<HTMLElement>("border");

const bounds = ref<{
  left: number;
  top: number;
  width: number;
  height: number;
} | null>(null);

function computeBounds() {
  const render = renderRoot.value;

  if (!render) return;

  const renderRect = render.getBoundingClientRect();

  let minLeft = Infinity;
  let minTop = Infinity;
  let maxRight = -Infinity;
  let maxBottom = -Infinity;

  props.node.children.forEach((child) => {
    const el = document.getElementById(child.id);

    if (!el) return;

    const rect = el.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) return;

    minLeft = Math.min(minLeft, rect.left);
    minTop = Math.min(minTop, rect.top);
    maxRight = Math.max(maxRight, rect.right);
    maxBottom = Math.max(maxBottom, rect.bottom);
  });

  if (minLeft === Infinity) {
    bounds.value = null;

    return;
  }

  bounds.value = {
    left: ((minLeft - renderRect.left) / renderRect.width) * 100,
    top: ((minTop - renderRect.top) / renderRect.height) * 100,
    width: ((maxRight - minLeft) / renderRect.width) * 100,
    height: ((maxBottom - minTop) / renderRect.height) * 100,
  };
}

const borderStyle = computed(() => {
  if (!bounds.value) return { display: "none" };

  return {
    left: `${bounds.value.left}%`,
    top: `${bounds.value.top}%`,
    width: `${bounds.value.width}%`,
    height: `${bounds.value.height}%`,
  };
});

let rafId = 0;

function scheduleBounds() {
  if (presenting.value || rafId) return;

  rafId = requestAnimationFrame(() => {
    rafId = 0;
    computeBounds();
  });
}

useMutationObserver(container, scheduleBounds, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ["style"],
  characterData: true,
});

useResizeObserver(renderRoot, scheduleBounds);

onMounted(() => nextTick(computeBounds));

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
});

const { x, y, isDragging } = useDraggable(border, { exact: true });

const startPositions = ref<Map<string, { x: number; y: number }> | null>(null);
const startDrag = ref<{ x: number; y: number } | null>(null);

let movable: Tree[] = [];
let startBox: Rect | null = null;

const throttle = useFrameThrottle();

watchThrottled(
  [x, y],
  ([newX, newY]) => {
    if (props.isLocked) return;

    if (!isDragging.value) return;

    if (!startPositions.value || !startDrag.value) {
      movable = flattenTree(props.node).filter((n) => n.type !== "core.group");

      const snapshot = new Map<string, { x: number; y: number }>();

      movable.forEach((node) => {
        const transform = getNodeComponent(node.id, "core.transform");

        if (!transform) return;

        if (anyBound(transform.data, ["position.x", "position.y"])) return;

        snapshot.set(node.id, {
          x: transform.data.position.x,
          y: transform.data.position.y,
        });
      });

      startPositions.value = snapshot;
      startDrag.value = { x: newX, y: newY };

      startBox = border.value && canvasRect(border.value);

      begin([props.node.id]);

      return;
    }

    const { x: scaleX, y: scaleY } = scale();

    let deltaX = (newX - startDrag.value.x) * scaleX;
    let deltaY = (newY - startDrag.value.y) * scaleY;

    if (startBox) {
      const snapped = apply({
        ...startBox,
        left: startBox.left + deltaX,
        top: startBox.top + deltaY,
      });

      deltaX = snapped.left - startBox.left;
      deltaY = snapped.top - startBox.top;
    }

    movable.forEach((node) => {
      const start = startPositions.value?.get(node.id);
      const transform = getNodeComponent(node.id, "core.transform");

      if (!start || !transform) return;

      transform.data.position.x = Math.round(start.x + deltaX);
      transform.data.position.y = Math.round(start.y + deltaY);
    });
  },
  { throttle },
);

watch(isDragging, (newState) => {
  setIsDragging(newState);

  if (!newState) {
    if (startPositions.value) {
      for (const node of movable) {
        const transform = getNodeComponent(node.id, "core.transform");

        if (transform) updateComponent(transform);
      }
    }

    startPositions.value = null;
    startDrag.value = null;
    startBox = null;
    movable = [];

    end();
  }
});

const { selectFromEvent, clear } = useNodeSelection();

function onSelect(event: MouseEvent) {
  selectFromEvent(props.node, event);
}

function onClick(event: MouseEvent) {
  if (!presenting.value) return;

  if (fire(props.node, "click")) event.stopPropagation();
}

function onHover() {
  if (presenting.value) fire(props.node, "hover");
}
</script>

<template>
  <div class="contents" ref="container">
    <div
      ref="border"
      :id="props.node.id"
      class="group-border"
      :class="[selectedNode === props.node ? 'outline-dark-900!' : '']"
      :style="borderStyle"
      :tabindex="0"
      @click="selectNode"
      @mousedown="selectNode"
      @click.right="cancelSelection"
      @keydown.esc="cancelSelection"
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
  @apply outline outline-3 outline-dashed outline-dark-900/0 hover:outline-dark-900;
  @apply border-rd;
}
</style>

<script setup lang="ts">
import { flattenTree } from "~/utils/tree";

const { selectedNode } = storeToRefs(useDeckStore());
const { getNodeComponent } = useNodeComponents();

const { setIsDragging } = useAtelierStore();

const { renderEl, scale } = useCanvasScale();

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
  const render = renderEl();

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

// Many child mutations can fire per frame during a drag; coalesce them into a
// single bounds read per frame so we don't force repeated layout flushes.
function scheduleBounds() {
  if (rafId) return;

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

useResizeObserver(renderEl, scheduleBounds);

onMounted(() => nextTick(computeBounds));

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
});

const { x, y, isDragging } = useDraggable(border, { exact: true });

const startPositions = ref<Map<string, { x: number; y: number }> | null>(null);
const startDrag = ref<{ x: number; y: number } | null>(null);

let movable: Tree[] = [];

const throttle = useFrameThrottle();

watchThrottled(
  [x, y],
  ([newX, newY]) => {
    if (props.isLocked) return;

    if (!startPositions.value || !startDrag.value) {
      movable = flattenTree(props.node).filter((n) => n.type !== "core.group");

      const snapshot = new Map<string, { x: number; y: number }>();

      movable.forEach((node) => {
        const transform = getNodeComponent(node.id, "core.transform");

        if (transform) {
          snapshot.set(node.id, {
            x: transform.data.position.x,
            y: transform.data.position.y,
          });
        }
      });

      startPositions.value = snapshot;
      startDrag.value = { x: newX, y: newY };

      return;
    }

    const { x: scaleX, y: scaleY } = scale();

    const deltaX = (newX - startDrag.value.x) * scaleX;
    const deltaY = (newY - startDrag.value.y) * scaleY;

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
    startPositions.value = null;
    startDrag.value = null;
    movable = [];
  }
});

function selectNode(event: Event) {
  event.stopPropagation();

  if (selectedNode.value === props.node) return;

  selectedNode.value = props.node;
}

function cancelSelection() {
  selectedNode.value = null;
}
</script>

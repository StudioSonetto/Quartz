<template>
  <component
    v-if="render?.component"
    :is="render.component"
    :node="props.node"
    :isLocked="props.isLocked"
  />
  <Component
    v-else-if="render?.element"
    :is="render.element"
    :key="props.node.path"
    :style="[elementStyle]"
    :id="props.node.id"
    :class="[
      props.node.path === 'root' ? 'root' : 'element',
      selectedNode === props.node ? 'outline-dark-900!' : '',
    ]"
    ref="element"
    class="element"
    :tabindex="0"
    @click="selectNode"
    @mousedown="selectNode"
    @click.right="cancelSelection"
    @keydown.esc="cancelSelection"
  >
    {{ render.content }}
    <AtelierRenderElement
      v-for="child in props.node.children"
      :key="child.id"
      :node="child"
      :isLocked="props.isLocked"
    />
  </Component>
</template>

<style scoped lang="postcss">
.element {
  @apply absolute transform-origin-top-left;
  @apply outline outline-3 outline-dark-900/0 hover:outline-dark-900;
  @apply border-rd;
}
</style>

<script setup lang="ts">
import { getModuleApi } from "~/modules/registry";
import type { WebglApi } from "~/modules/webgl/types";

const { resolveRender } = useElementRenderer();
const { selectedNode } = storeToRefs(useDeckStore());
const { getNodeComponent } = useNodeComponents();

const { setIsDragging } = useAtelierStore();
const { canvasSize, snapThreshold } = storeToRefs(useAtelierStore());

const { scale } = useCanvasScale();

const element = useTemplateRef<HTMLElement>("element");

const props = defineProps<{
  node: Tree;
  isLocked?: boolean;
}>();

const isGridChild = computed(() => {
  const parent = props.node.parent;
  if (!parent) return false;
  return getNodeComponent(parent.id, "core.layout")?.data.mode === "grid";
});

const isMounted = ref(false);

const { x, y, isDragging } = useDraggable(element, { exact: true });

const startTransform = ref<{ x: number; y: number } | null>(null);
const startDrag = ref<{ x: number; y: number } | null>(null);

const canvasCentre = {
  x: canvasSize.value.width / 2,
  y: canvasSize.value.height / 2,
};

function getElementDimensions() {
  const elementBounds = element.value?.getBoundingClientRect();

  if (!elementBounds) return;

  const { x: scaleX, y: scaleY } = scale();

  return {
    width: elementBounds.width * scaleX,
    height: elementBounds.height * scaleY,
    scaleX,
    scaleY,
  };
}

function snapToCentre(x: number, y: number, width: number, height: number) {
  const centreX = x + width / 2;
  const centreY = y + height / 2;

  return {
    x:
      Math.abs(centreX - canvasCentre.x) < snapThreshold.value
        ? canvasCentre.x - width / 2
        : x,
    y:
      Math.abs(centreY - canvasCentre.y) < snapThreshold.value
        ? canvasCentre.y - height / 2
        : y,
  };
}

function snapToEdge(x: number, y: number, width: number, height: number) {
  const edges = [
    { condition: Math.abs(x) < snapThreshold.value, value: 0, axis: "x" },
    { condition: Math.abs(y) < snapThreshold.value, value: 0, axis: "y" },
    {
      condition: Math.abs(x + width - 1920) < snapThreshold.value,
      value: canvasSize.value.width - width,
      axis: "x",
    },
    {
      condition: Math.abs(y + height - 1080) < snapThreshold.value,
      value: canvasSize.value.height - height,
      axis: "y",
    },
  ];

  let snappedX = x;
  let snappedY = y;

  edges.forEach((edge) => {
    if (!edge.condition) return;

    if (edge.axis === "x") {
      snappedX = edge.value;
    } else {
      snappedY = edge.value;
    }
  });

  return { x: snappedX, y: snappedY };
}

function applySnapping(x: number, y: number): { x: number; y: number } {
  const dimensions = getElementDimensions();

  if (!dimensions) return { x, y };

  const { width, height } = dimensions;

  const centreSnapped = snapToCentre(x, y, width, height);

  return snapToEdge(centreSnapped.x, centreSnapped.y, width, height);
}

const throttle = useFrameThrottle();

watchThrottled(
  [x, y],
  ([newX, newY]) => {
    if (props.isLocked) return;
    if (isGridChild.value) return;

    const transform = getNodeComponent(props.node.id, "core.transform");

    if (!transform) return;

    if (!startTransform.value || !startDrag.value) {
      startTransform.value = {
        x: transform.data.position.x,
        y: transform.data.position.y,
      };
      startDrag.value = { x: newX, y: newY };

      return;
    }

    const deltaX = newX - startDrag.value.x;
    const deltaY = newY - startDrag.value.y;

    const { x: scaleX, y: scaleY } = scale();

    const newPosX = startTransform.value.x + deltaX * scaleX;
    const newPosY = startTransform.value.y + deltaY * scaleY;

    const snappedPos = applySnapping(newPosX, newPosY);

    transform.data.position.x = Math.round(snappedPos.x);
    transform.data.position.y = Math.round(snappedPos.y);
  },
  { throttle },
);

watch(isDragging, (newState) => {
  setIsDragging(newState);

  if (!newState) {
    startTransform.value = null;
    startDrag.value = null;
  }
});

const render = computed(() => {
  if (!isMounted.value) return;

  return resolveRender(props.node);
});

const elementStyle = computed(() => {
  const base = render.value?.style;

  if (!base || !isGridChild.value) return base;

  return { ...base, position: "static", left: "", top: "", transform: "" };
});

function selectNode(event: Event) {
  event.stopPropagation();

  if (selectedNode.value === props.node) return;

  selectedNode.value = props.node;
}

function cancelSelection() {
  selectedNode.value = null;
}

onMounted(() => {
  isMounted.value = true;

  if (props.node.type === "webgl.canvas") {
    nextTick(() => {
      getModuleApi<WebglApi>("webgl")?.setupCanvas(props.node.id);
    });
  }
});
</script>

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
      isSelected(props.node.id) ? 'outline-accent!' : '',
    ]"
    ref="element"
    class="element"
    :tabindex="0"
    :contenteditable="editing ? 'plaintext-only' : 'false'"
    @click="onSelect"
    @mousedown="onSelect"
    @dblclick="onDoubleClick"
    @blur="saveEditing"
    @click.right="clear"
    @keydown.esc="onEscape"
    @keydown.up="nudge(0, -1, $event)"
    @keydown.down="nudge(0, 1, $event)"
    @keydown.left="nudge(-1, 0, $event)"
    @keydown.right="nudge(1, 0, $event)"
  >
    {{ render.content
    }}<AtelierRenderElement
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
  @apply outline outline-3 outline-accent/0 hover:outline-accent;
  @apply border-rd;
}
</style>

<script setup lang="ts">
import { getModuleApi } from "~/modules/registry";
import type { WebglApi } from "~/modules/webgl/types";
import { snappingKey } from "~/composables/useSnapping";

const { resolveRender } = useElementRenderer();
const deck = useDeckStore();
const { isSelected, updateComponent } = deck;
const { getNodeComponent, isGridChild: isNodeGridChild } = useNodeComponents();

const { setIsDragging } = useAtelierStore();

const { scale } = useCanvasScale();
const { begin, apply, end } = inject(snappingKey)!;

const element = useTemplateRef<HTMLElement>("element");

const props = defineProps<{
  node: Tree;
  isLocked?: boolean;
}>();

const isGridChild = computed(() => isNodeGridChild(props.node));

const {
  editing,
  editable,
  start: startEditing,
  save: saveEditing,
} = useInlineTextEdit(
  () => props.node,
  () => element.value,
);

function onDoubleClick(event: MouseEvent) {
  if (!editing.value && editable()) startEditing(event);
}

function onEscape() {
  if (editing.value) saveEditing();
  else clear();
}

const isMounted = ref(false);

const { x, y, isDragging } = useDraggable(element, {
  exact: true,
  disabled: editing,
});

const startTransform = ref<{ x: number; y: number } | null>(null);
const startDrag = ref<{ x: number; y: number } | null>(null);

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

      begin([props.node.id]);

      return;
    }

    const deltaX = newX - startDrag.value.x;
    const deltaY = newY - startDrag.value.y;

    const { x: scaleX, y: scaleY } = scale();

    const newPosX = startTransform.value.x + deltaX * scaleX;
    const newPosY = startTransform.value.y + deltaY * scaleY;

    const rect = element.value?.getBoundingClientRect();
    const snapped = apply({
      left: newPosX,
      top: newPosY,
      width: (rect?.width ?? 0) * scaleX,
      height: (rect?.height ?? 0) * scaleY,
    });

    transform.data.position.x = Math.round(snapped.left);
    transform.data.position.y = Math.round(snapped.top);
  },
  { throttle },
);

watch(isDragging, (newState) => {
  setIsDragging(newState);

  if (!newState) {
    if (startTransform.value) {
      const transform = getNodeComponent(props.node.id, "core.transform");

      if (transform) updateComponent(transform);
    }

    startTransform.value = null;
    startDrag.value = null;

    end();
  }
});

const render = computed(() => {
  if (!isMounted.value) return;

  return resolveRender(props.node);
});

const elementStyle = computed(() => {
  const base = render.value?.style;

  if (!base || !isGridChild.value) return base;

  const grid = {
    ...base,
    position: "static",
    left: "",
    top: "",
    transform: "",
  };

  // Editable (text) grid children keep pointer events (inline text edit)
  return editable() ? grid : { ...grid, pointerEvents: "none" };
});

const { selectFromEvent, clear } = useNodeSelection();
const { soleSelected } = storeToRefs(deck);

function onSelect(event: MouseEvent) {
  if (editing.value) {
    event.stopPropagation();

    return;
  }

  const target =
    isGridChild.value && props.node.parent ? props.node.parent : props.node;

  selectFromEvent(target, event);
}

function nudge(dx: number, dy: number, event: KeyboardEvent) {
  // Arrow keys move the caret while editing, not the node.
  if (
    editing.value ||
    props.isLocked ||
    soleSelected.value?.id !== props.node.id ||
    isGridChild.value
  )
    return;

  event.preventDefault();
  event.stopPropagation();

  const step = event.shiftKey ? 10 : 1;
  const transform = getNodeComponent(props.node.id, "core.transform");

  if (!transform) return;

  transform.data.position.x += dx * step;
  transform.data.position.y += dy * step;

  updateComponent(transform);
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

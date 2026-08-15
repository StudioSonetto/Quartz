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
      { 'element-hoverable': !presenting },
    ]"
    ref="element"
    class="element"
    :tabindex="0"
    :contenteditable="editing ? 'plaintext-only' : 'false'"
    @click="onClick"
    @mousedown="onSelect"
    @mouseenter="onHover"
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
  @apply outline outline-3 outline-accent/0;
  @apply border-rd;
}

.element-hoverable {
  @apply hover:outline-accent;
}
</style>

<script setup lang="ts">
import { getNodeType } from "~/modules/registry";
import { snappingKey } from "~/composables/useSnapping";

const { resolveRender } = useElementRenderer();
const deck = useDeckStore();
const { isSelected, updateComponent } = deck;
const { getNodeComponent, isGridChild: isNodeGridChild } = useNodeComponents();

const { setIsDragging } = useAtelierStore();

const presenting = inject(presentingKey, ref(false));
const { fire } = useEventDispatch();

const { canvasRect, scale } = useCanvasScale();
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
  if (presenting.value) return;

  if (!editing.value && editable()) startEditing(event);
}

function onEscape() {
  if (editing.value) saveEditing();
  else clear();
}

const isMounted = ref(false);

let gesture: {
  drag: DragGesture;
  box: Rect;
  origin: { x: number; y: number };
  scale: { x: number; y: number };
  moved: boolean;
} | null = null;

const { x, y, isDragging } = useDraggable(element, {
  exact: true,
  disabled: editing,
  onStart: (position, event) => {
    if (props.isLocked) return;

    const drag = getNodeType(props.node.type)?.drag?.(props.node, event);

    if (!drag) return;

    const el = document.getElementById(drag.node);
    const box = el && canvasRect(el);

    if (!box) return;

    gesture = {
      drag,
      box,
      origin: { x: event.clientX - position.x, y: event.clientY - position.y },
      scale: scale(),
      moved: false,
    };

    begin([drag.node]);
  },
});

const dragStart = ref<{
  transform: { x: number; y: number };
  pointer: { x: number; y: number };
  size: { width: number; height: number };
} | null>(null);

const throttle = useFrameThrottle();

watchThrottled(
  [x, y],
  ([newX, newY]) => {
    if (props.isLocked) return;

    // The trailing flush lands after the drag ended and its state was cleared —
    // acting on it would seed the next drag from a stale pointer origin.
    if (!isDragging.value) return;

    if (gesture) {
      const { drag, box, origin, scale: s } = gesture;

      gesture.moved = true;

      const snapped = apply({
        ...box,
        left: box.left + (newX - origin.x) * s.x,
        top: box.top + (newY - origin.y) * s.y,
      });

      return drag.move(
        (snapped.left - box.left) / s.x,
        (snapped.top - box.top) / s.y,
      );
    }

    if (isGridChild.value) return;

    const transform = getNodeComponent(props.node.id, "core.transform");

    if (!transform) return;

    if (anyBound(transform.data, ["position.x", "position.y"])) return;

    if (!dragStart.value) {
      const rect = element.value?.getBoundingClientRect();
      const { x: scaleX, y: scaleY } = scale();

      dragStart.value = {
        transform: {
          x: transform.data.position.x,
          y: transform.data.position.y,
        },
        pointer: { x: newX, y: newY },
        size: {
          width: (rect?.width ?? 0) * scaleX,
          height: (rect?.height ?? 0) * scaleY,
        },
      };

      begin([props.node.id]);

      return;
    }

    const { transform: startPos, pointer, size } = dragStart.value;
    const { x: scaleX, y: scaleY } = scale();

    const snapped = apply({
      left: startPos.x + (newX - pointer.x) * scaleX,
      top: startPos.y + (newY - pointer.y) * scaleY,
      width: size.width,
      height: size.height,
    });

    transform.data.position.x = Math.round(snapped.left);
    transform.data.position.y = Math.round(snapped.top);
  },
  { throttle },
);

watch(isDragging, (newState) => {
  setIsDragging(newState);

  if (!newState) {
    if (gesture) {
      // A press with no movement is a click — ending it would commit a save.
      if (gesture.moved) gesture.drag.end?.();

      gesture = null;
    } else if (dragStart.value) {
      const transform = getNodeComponent(props.node.id, "core.transform");

      if (transform) updateComponent(transform);
    }

    dragStart.value = null;

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

  return editable() ? grid : { ...grid, pointerEvents: "none" };
});

const { selectFromEvent, clear } = useNodeSelection();
const { soleSelected } = storeToRefs(deck);

function onSelect(event: MouseEvent) {
  if (presenting.value) return;

  if (editing.value) {
    event.stopPropagation();

    return;
  }

  const picked = getNodeType(props.node.type)?.pick?.(props.node, event);

  if (picked) return selectFromEvent(picked, event);

  const target =
    isGridChild.value && props.node.parent ? props.node.parent : props.node;

  selectFromEvent(target, event);
}

function onClick(event: MouseEvent) {
  if (!presenting.value) return onSelect(event);

  if (fire(props.node, "click")) event.stopPropagation();
}

function onHover() {
  if (presenting.value) fire(props.node, "hover");
}

function nudge(dx: number, dy: number, event: KeyboardEvent) {
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

  const def = getNodeType(props.node.type);

  if (def?.onMount) nextTick(() => def.onMount!(props.node.id));
});
</script>

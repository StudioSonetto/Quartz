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
    :class="{ root: props.node.path === ROOT_PATH }"
    ref="element"
    class="element"
    :tabindex="0"
    :contenteditable="editing ? 'plaintext-only' : 'false'"
    @click="onClick"
    @mousedown="onSelect"
    @mouseenter="onHover"
    @mouseover="onMouseOver"
    @mousemove="onPointerMove"
    @mouseleave="clearHover"
    @dblclick="onDoubleClick"
    @blur="saveEditing"
    @click.right="clear"
    @keydown="onKeydown"
  ><AtelierRenderPaint v-if="render.paint" :paint="render.paint" />{{
      render.content
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
  @apply absolute transform-origin-top-left border-rd;
}
</style>

<script setup lang="ts">
const { resolveRender } = useElementRenderer();
const deck = useDeckStore();
const { updateComponent } = deck;
const { getNodeComponent, isGridChild: isNodeGridChild } = useNodeComponents();

const atelier = useAtelierStore();
const { setIsDragging, setHovered } = atelier;
const { hoveredNodeId } = storeToRefs(atelier);

const presenting = inject(presentingKey, ref(false));
const { fire } = useEventDispatch();

const { canvasRect, scale } = useCanvasScale();
const { begin, apply, end } = inject(snappingKey)!;

const history = useHistoryStore();
const move = useHistoryGesture("Move");

useEventListener(window, "pointercancel", () => move.stop());

const element = useTemplateRef<HTMLElement>("element");

const props = defineProps<{
  node: Tree;
  isLocked?: boolean;
}>();

const isGridChild = computed(() => isNodeGridChild(props.node));

const locked = computed(() => props.isLocked || isNodeLocked(props.node));

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
  if (presenting.value || locked.value) return;

  if (!editing.value && editable()) startEditing(event);
}

const NUDGES: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    if (editing.value) saveEditing();
    else clear();

    return;
  }

  const step = NUDGES[event.key];

  if (step) nudge(step[0], step[1], event);
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
  disabled: computed(() => editing.value || atelier.activeTool !== "select"),
  onStart: (position, event) => {
    if (props.isLocked) return;

    const drag = getNodeType(props.node.type)?.drag?.(props.node, event);

    if (!drag) return;

    if (isNodeLocked(deck.getNodeAsTree(drag.node))) return;

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

    move.start();
    begin([drag.node]);
  },
});

const dragStart = ref<{
  transform: { x: number; y: number };
  pointer: { x: number; y: number };
  box: Rect;
} | null>(null);

const throttle = useFrameThrottle();

watchThrottled(
  [x, y],
  ([newX, newY]) => {
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

    if (locked.value || isGridChild.value) return;

    const transform = getNodeComponent(props.node.id, "core.transform");

    if (!transform) return;

    if (anyBound(transform.data, ["position.x", "position.y"])) return;

    if (!dragStart.value) {
      const box = element.value && canvasRect(element.value);

      if (!box) return;

      dragStart.value = {
        transform: {
          x: transform.data.position.x,
          y: transform.data.position.y,
        },
        pointer: { x: newX, y: newY },
        box,
      };

      move.start();
      begin([props.node.id]);

      return;
    }

    const { transform: startPos, pointer, box } = dragStart.value;
    const { x: scaleX, y: scaleY } = scale();

    const snapped = apply({
      ...box,
      left: box.left + (newX - pointer.x) * scaleX,
      top: box.top + (newY - pointer.y) * scaleY,
    });

    transform.data.position.x = Math.round(
      startPos.x + snapped.left - box.left,
    );
    transform.data.position.y = Math.round(startPos.y + snapped.top - box.top);
  },
  { throttle },
);

watch(isDragging, (newState) => {
  setIsDragging(newState);

  if (!newState) {
    if (gesture) {
      if (gesture.moved) gesture.drag.end?.();

      gesture = null;
    } else if (dragStart.value) {
      const transform = getNodeComponent(props.node.id, "core.transform");

      if (transform) updateComponent(transform);
    }

    dragStart.value = null;

    move.stop();
    end();
  }
});

const render = computed(() => {
  if (!isMounted.value) return;

  return resolveRender(props.node);
});

const elementStyle = computed(() => {
  const base = render.value?.style;

  const style =
    base && isGridChild.value
      ? { ...base, position: "static", left: "", top: "", transform: "" }
      : base;

  const def = getNodeType(props.node.type);
  const passThrough =
    isNodeLocked(props.node) &&
    def?.hitTest !== "contents" &&
    !presenting.value;

  if (passThrough || (isGridChild.value && !editable()))
    return { ...style, pointerEvents: "none" };

  return style;
});

const { selectFromEvent, clear } = useNodeSelection();
const marquee = inject(marqueeKey);
const { soleSelected } = storeToRefs(deck);

function onSelect(event: MouseEvent) {
  if (presenting.value) return;

  if (atelier.activeTool !== "select") return;

  if (props.isLocked) return;

  if (editing.value) {
    event.stopPropagation();

    return;
  }

  const picked = getNodeType(props.node.type)?.pick?.(props.node, event);

  const target =
    picked ??
    (isGridChild.value && props.node.parent ? props.node.parent : props.node);

  if (selectFromEvent(target, event)) return;

  if (event.type === "mousedown") marquee?.begin?.(event);
}

function onClick(event: MouseEvent) {
  if (!presenting.value) return onSelect(event);

  if (fire(props.node, "click")) event.stopPropagation();
}

function onHover() {
  if (presenting.value) fire(props.node, "hover");
}

const picked = ref<string | null>(null);

let pickFrame = 0;

const hoverSelf = computed(() => (locked.value ? null : props.node.id));

function onPointerMove(event: MouseEvent) {
  if (presenting.value || props.isLocked || isDragging.value || pickFrame)
    return;

  const pick = getNodeType(props.node.type)?.pick;

  if (!pick) return;

  pickFrame = requestAnimationFrame(() => {
    pickFrame = 0;

    picked.value = pick(props.node, event)?.id ?? null;

    setHovered(picked.value ?? hoverSelf.value);
  });
}

function onMouseOver(event: MouseEvent) {
  if (presenting.value || props.isLocked) return;

  event.stopPropagation();

  setHovered(picked.value ?? hoverSelf.value);
}

function clearHover() {
  if (pickFrame) {
    cancelAnimationFrame(pickFrame);
    pickFrame = 0;
  }

  const mine = picked.value ?? props.node.id;

  picked.value = null;

  if (hoveredNodeId.value === mine) setHovered(null);
}

function nudge(dx: number, dy: number, event: KeyboardEvent) {
  if (
    editing.value ||
    locked.value ||
    atelier.activeTool !== "select" ||
    soleSelected.value?.id !== props.node.id ||
    isGridChild.value
  )
    return;

  event.preventDefault();
  event.stopPropagation();

  const step = event.shiftKey ? 10 : 1;
  const transform = getNodeComponent(props.node.id, "core.transform");

  if (!transform) return;

  if (anyBound(transform.data, ["position.x", "position.y"])) return;

  history.captureCurrent(`nudge:${props.node.id}`);

  transform.data.position.x += dx * step;
  transform.data.position.y += dy * step;

  updateComponent(transform);
}

onUnmounted(clearHover);

onMounted(() => {
  isMounted.value = true;

  const def = getNodeType(props.node.type);

  if (def?.onMount) nextTick(() => def.onMount!(props.node.id));
});
</script>

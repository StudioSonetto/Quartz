<template>
  <div
    ref="renderEl"
    :style="[
      rootStyle,
      deck && {
        viewTransitionName: `deck-${deck}`,
        viewTransitionClass: 'deck-canvas',
      },
    ]"
    @click="onCanvasClick"
    @contextmenu="onCanvasMenu"
    @pointerdown="onCanvasPointerDown"
    @dragenter="canEdit && assetDrag.over($event)"
    @dragover="canEdit && assetDrag.over($event)"
    @drop="canEdit && assetDrag.drop($event)"
    @dragleave="canEdit && assetDrag.leave($event)"
    class="render"
    :class="[
      canEdit && `render-tool-${atelier.activeTool}`,
      {
        'render-deck': deck,
        'render-loading': !loaded,
        'render-hidden': !loaded && !cover,
      },
    ]"
  >
    <AtelierRenderGizmo v-if="canEdit" />
    <template v-if="loaded">
      <AtelierRenderElement
        v-for="node in currentTree!.children"
        :key="node.id"
        :node="node"
      />
    </template>
    <Transition name="render-cover">
      <AtelierRenderSnapshot
        v-if="!loaded && cover"
        :key="currentSlides?.id"
        :deck="deck ?? currentSlides!.deck"
        :slides="coverSlides"
        class="render-cover"
      />
    </Transition>
    <button
      v-if="!canEdit && soundBlocked"
      class="media-sound"
      @click.stop="unblockSound"
    >
      Click for sound
    </button>
  </div>
</template>

<style scoped lang="postcss">
.render {
  @apply w-full border-rd aspect-video;
  @apply bg-light-200 text-dark-900;
  @apply relative overflow-hidden transition-opacity duration-100 ease-out;

  &.render-loading {
    @apply bg-transparent;
  }

  &.render-hidden {
    @apply opacity-0;
  }

  &.render-tool-pen,
  &.render-tool-point {
    @apply cursor-crosshair;
  }

  &.render-tool-text {
    @apply cursor-text;
  }

  .root {
    @apply w-full h-full;
  }

  .render-cover {
    @apply absolute inset-0 z-10 pointer-events-none;
  }

  .render-cover-leave-active {
    @apply transition-opacity duration-100;
  }

  .render-cover-leave-to {
    @apply opacity-0;
  }

  .media-sound {
    @apply absolute bottom-4 right-4 z-10 px-3 py-1 rounded-full;
    @apply bg-dark-900/80 text-light-200 ui-text-3;
  }
}
</style>

<script setup lang="ts">
const deckStore = useDeckStore();
const history = useHistoryStore();
const { currentTree, currentSlides, currentSlidesIndex } =
  storeToRefs(deckStore);
const { select, clear } = useNodeSelection();
const atelier = useAtelierStore();
const { canvasSize } = storeToRefs(atelier);
const { getNodeComponent } = useNodeComponents();
const { imageUrl } = useAssetsStore();
const assetDrag = useAssetDrag();
const { blocked: soundBlocked, unblock: unblockSound } = useMediaSound();

const { scopeFor } = useVariableScope();

useTextSelection();

const { snapshotUrl } = useSnapshotsStore();

const coverSlides = computed(() =>
  currentSlides.value && snapshotUrl(currentSlides.value.id)
    ? currentSlides.value.id
    : undefined,
);

const cover = computed(
  () => !!coverSlides.value || (!!props.deck && !currentSlidesIndex.value),
);

const loaded = computed(
  () => !!currentTree.value && !isEmptyTree(currentTree.value),
);

const rootLayout = computed(() => {
  const root = currentTree.value;

  if (!root || !loaded.value) return undefined;

  const data = getNodeComponent(root.id, "core.layout")?.data;

  return data && resolveData(data, () => scopeFor(root));
});

const rootStyle = computed(() => {
  const layout = rootLayout.value;

  if (!layout) return {};

  return {
    ...backgroundStyle(layout.background, imageUrl),
    ...(layout.mode === "grid" ? gridStyle(layout) : {}),
  };
});

function onCanvasClick(event: MouseEvent) {
  if (!pressedCanvas || !props.canEdit) return;
  if (atelier.activeTool === "text" && event.button === 0 && loaded.value)
    return placeText(event);
  if (atelier.activeTool !== "select") return;

  const root = currentTree.value;

  if (rootLayout.value?.mode === "grid" && root) select(root);
  else clear();
}

function onCanvasMenu(event: MouseEvent) {
  if (!props.canEdit) return;

  onCanvasClick(event);
  openCommandMenu(event, CANVAS_MENU);
}

function placeText(event: MouseEvent) {
  const position = dropPosition(
    { x: event.clientX, y: event.clientY },
    renderEl.value!.getBoundingClientRect(),
    canvasSize.value,
    null,
  );
  const id = history.transact("Add text", () =>
    deckStore.createNode("Text", "core.text", {
      position,
      parentId: currentTree.value!.id,
    }),
  );

  atelier.setActiveTool("select");

  if (id) editNewText(id);
}

const pathTool: { press?: (event: PointerEvent) => void } = {};

provide(pathToolKey, pathTool);

function onCanvasPointerDown(event: PointerEvent) {
  if (props.canEdit) pathTool.press?.(event);
}

const props = withDefaults(
  defineProps<{
    canEdit?: boolean;
    interactive?: boolean;
    deck?: string;
  }>(),
  { interactive: true },
);

provide(
  presentingKey,
  computed(() => !props.canEdit),
);
provide(
  interactiveKey,
  computed(() => props.interactive),
);

const renderEl = useTemplateRef<HTMLElement>("renderEl");

let pressedCanvas = false;

useEventListener(
  window,
  "pointerdown",
  (event: PointerEvent) => {
    const el = event.target as Element | null;

    pressedCanvas =
      el === renderEl.value ||
      !!el?.classList.contains("marquee-detector") ||
      (atelier.activeTool === "text" && !!renderEl.value?.contains(el));
  },
  { capture: true },
);

provide(renderRootKey, renderEl);

provide(marqueeKey, {});

const { width, height } = useElementSize(renderEl);

const scale = computed(() =>
  Math.min(
    width.value / canvasSize.value.width,
    height.value / canvasSize.value.height,
  ),
);

provide(renderScaleKey, scale);

const snapping = useSnapping();

provide(snappingKey, snapping);
</script>

<style lang="postcss">
:root:not(:has(.preview-deck, .render-deck)) {
  @apply [view-transition-name:none];
}

::view-transition {
  @apply pointer-events-none;
}

.render {
  @apply [view-transition-name:slide];
}

::view-transition-group(slide) {
  @apply overflow-clip;
}
</style>

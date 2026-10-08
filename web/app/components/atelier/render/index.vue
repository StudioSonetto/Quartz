<template>
  <div
    ref="renderEl"
    :style="rootStyle"
    @click="onCanvasClick"
    @click.right="onCanvasClick"
    @pointerdown="onCanvasPointerDown"
    @dragenter="canEdit && assetDrag.over($event)"
    @dragover="canEdit && assetDrag.over($event)"
    @drop="canEdit && assetDrag.drop($event)"
    @dragleave="canEdit && assetDrag.leave($event)"
    class="render"
    :class="{
      'render-drawing': canEdit && atelier.activeTool !== 'select',
      'render-loading': !loaded,
      'render-hidden': !loaded && !coverUrl,
    }"
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
        v-if="!loaded && coverUrl && currentSlides"
        :key="currentSlides.id"
        :deck="currentSlides.deck"
        :slides="currentSlides.id"
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
  @apply relative overflow-hidden transition-opacity duration-150 ease-out;

  &.render-loading {
    @apply bg-transparent;
  }

  &.render-hidden {
    @apply opacity-0;
  }

  &.render-drawing {
    @apply cursor-crosshair;
  }

  .root {
    @apply w-full h-full;
  }

  .render-cover {
    @apply absolute inset-0 z-10 pointer-events-none;
  }

  .render-cover-leave-active {
    @apply transition-opacity;
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
const { currentTree, currentSlides } = storeToRefs(useDeckStore());
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

const coverUrl = computed(
  () => currentSlides.value && snapshotUrl(currentSlides.value.id),
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

function onCanvasClick() {
  if (!pressedCanvas || !props.canEdit) return;
  if (atelier.activeTool !== "select") return;

  const root = currentTree.value;

  if (rootLayout.value?.mode === "grid" && root) select(root);
  else clear();
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
      el === renderEl.value || !!el?.classList.contains("marquee-detector");
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
:root[data-slide-transition] .render {
  @apply [view-transition-name:slide];
}

::view-transition-group(*),
::view-transition-old(*),
::view-transition-new(*) {
  @apply animate-duration-$slide-duration animate-ease-$slide-easing;
}

::view-transition-group(slide) {
  @apply overflow-clip;
}

:root[data-slide-transition="push"] {
  &[data-slide-direction="forward"]::view-transition-old(slide) {
    @apply animate-slide-out-left animate-duration-$slide-duration animate-ease-$slide-easing;
  }

  &[data-slide-direction="forward"]::view-transition-new(slide) {
    @apply animate-slide-in-right animate-duration-$slide-duration animate-ease-$slide-easing;
  }

  &[data-slide-direction="back"]::view-transition-old(slide) {
    @apply animate-slide-out-right animate-duration-$slide-duration animate-ease-$slide-easing;
  }

  &[data-slide-direction="back"]::view-transition-new(slide) {
    @apply animate-slide-in-left animate-duration-$slide-duration animate-ease-$slide-easing;
  }
}
</style>

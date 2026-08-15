<template>
  <div
    ref="renderEl"
    :style="rootStyle"
    @click="onCanvasClick"
    @click.right="onCanvasClick"
    @dragenter="canEdit && assetDrag.over($event)"
    @dragover="canEdit && assetDrag.over($event)"
    @drop="canEdit && assetDrag.drop($event)"
    @dragleave="canEdit && assetDrag.leave($event)"
    class="render"
  >
    <AtelierRenderHandles v-if="canEdit" />
    <AtelierRenderMarquee v-if="canEdit" />
    <AtelierRenderSelection v-if="canEdit" />
    <AtelierRenderGuides v-if="canEdit" :guides="snapping.guides.value" />
    <AtelierRenderGhost v-if="canEdit" />
    <template v-if="currentTree && !isEmptyTree(currentTree)">
      <AtelierRenderElement
        v-for="node in currentTree.children"
        :key="node.id"
        :node="node"
        :isLocked="!props.canEdit"
      />
    </template>
    <div v-else class="loader">
      <p>Loading...</p>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.render {
  @apply w-full border-rd aspect-video;
  @apply bg-light-200 text-dark-900;
  @apply relative overflow-hidden;

  .root {
    @apply w-full h-full;
  }

  .loader {
    @apply flex justify-center items-center h-full;
  }
}
</style>

<script setup lang="ts">
const { currentTree } = storeToRefs(useDeckStore());
const { select, clear } = useNodeSelection();
const { canvasSize } = storeToRefs(useAtelierStore());
const { getNodeComponent } = useNodeComponents();
const { imageUrl } = useAssetsStore();
const assetDrag = useAssetDrag();

const { scopeFor } = useVariableScope();

const rootLayout = computed(() => {
  const root = currentTree.value;

  if (!root || isEmptyTree(root)) return undefined;

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
  if (!pressedCanvas) return;

  const root = currentTree.value;

  if (rootLayout.value?.mode === "grid" && root) select(root);
  else clear();
}

const props = defineProps<{
  canEdit?: boolean;
}>();

provide(
  presentingKey,
  computed(() => !props.canEdit),
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

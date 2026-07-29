<template>
  <div ref="renderEl" @click="clear" @click.right="clear" class="render">
    <AtelierRenderHandles v-if="canEdit" />
    <AtelierRenderMarquee v-if="canEdit" />
    <AtelierRenderGuides v-if="canEdit" :guides="snapping.guides.value" />
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
const { clear } = useNodeSelection();
const { canvasSize } = storeToRefs(useAtelierStore());

const props = defineProps<{
  canEdit?: boolean;
}>();

const renderEl = useTemplateRef<HTMLElement>("renderEl");

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

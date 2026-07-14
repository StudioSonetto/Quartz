<template>
  <div
    ref="renderEl"
    @click="selectedNode = null"
    @click.right="selectedNode = null"
    class="render"
  >
    <span
      v-if="canEdit && isDragging && isVerticallyCentered"
      class="w-full h-0.5 bg-red-500 absolute z-99 top-1/2 -translate-y-1/2"
    ></span>
    <span
      v-if="canEdit && isDragging && isHorizontallyCentered"
      class="h-full w-0.4 bg-red-500 absolute z-99 left-1/2 -translate-x-1/2"
    ></span>
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
const { currentTree, selectedNode } = storeToRefs(useDeckStore());
const { isDragging, snapThreshold } = storeToRefs(useAtelierStore());

const props = defineProps<{
  canEdit?: boolean;
}>();

const renderEl = useTemplateRef<HTMLElement>("renderEl");

const isHorizontallyCentered = ref(false);
const isVerticallyCentered = ref(false);

function checkAlignment() {
  if (!isDragging.value || !renderEl.value || !selectedNode.value) return;

  const draggedElement = document.getElementById(selectedNode.value.id);

  if (!draggedElement) return;

  const renderRect = renderEl.value.getBoundingClientRect();
  const elementRect = draggedElement.getBoundingClientRect();

  const renderCenterX = renderRect.left + renderRect.width / 2;
  const renderCenterY = renderRect.top + renderRect.height / 2;

  const elementCenterX = elementRect.left + elementRect.width / 2;
  const elementCenterY = elementRect.top + elementRect.height / 2;

  const horizontalDistance = Math.abs(elementCenterX - renderCenterX);

  isHorizontallyCentered.value = horizontalDistance <= snapThreshold.value;

  const verticalDistance = Math.abs(elementCenterY - renderCenterY);

  isVerticallyCentered.value = verticalDistance <= snapThreshold.value;
}

let animationFrameId: number | null = null;

function startAlignmentCheck() {
  if (animationFrameId) return;

  function checkLoop() {
    checkAlignment();

    if (isDragging.value) {
      animationFrameId = requestAnimationFrame(checkLoop);
    } else {
      animationFrameId = null;
    }
  }

  animationFrameId = requestAnimationFrame(checkLoop);
}

watch(isDragging, (newState) => {
  if (newState) {
    startAlignmentCheck();
  } else {
    isHorizontallyCentered.value = false;
    isVerticallyCentered.value = false;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);

      animationFrameId = null;
    }
  }
});

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

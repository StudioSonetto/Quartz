<template>
  <AtelierInspectorView name="Properties" :actions="[]">
    <div v-if="selectedNode" class="view" @contextmenu.prevent>
      <Component
        v-for="component in nodeComponents"
        :key="`${component.node}-${component.type}`"
        :is="resolvedComponents[component.type]"
        :component="component"
      />
    </div>
    <div v-else class="placeholder" @contextmenu.prevent>
      <div class="i-carbon-error"></div>
      <p>No node selected</p>
    </div>
  </AtelierInspectorView>
</template>

<style scoped lang="postcss">
.view,
.placeholder {
  @apply w-full h-full;
  @apply border-rd border-0;
  @apply bg-dark-800 text-light-200;
}

.view {
  @apply overflow-y-auto;

  &::-webkit-scrollbar {
    @apply hidden;
  }
}

.placeholder {
  @apply flex flex-col justify-center items-center;
  @apply ui-text-3;

  .i-carbon-error {
    @apply ui-text-6 mb-6;
  }
}
</style>

<script setup lang="ts">
const { currentTree, selectedNode } = storeToRefs(useDeckStore());
const { getNodeComponents } = useNodeComponents();

// https://github.com/nuxt/nuxt/issues/14036
const resolvedComponents = {
  animation: resolveComponent("LazyNodeComponentAnimation"),
  base: resolveComponent("LazyNodeComponentBase"),
  camera: resolveComponent("LazyNodeComponentCamera"),
  layout: resolveComponent("LazyNodeComponentLayout"),
  model: resolveComponent("LazyNodeComponentModel"),
  scene: resolveComponent("LazyNodeComponentScene"),
  transform: resolveComponent("LazyNodeComponentTransform"),
  typography: resolveComponent("LazyNodeComponentTypography"),
};

const nodeComponents = computed<ComponentModel[]>(() => {
  if (!selectedNode.value?.id || !currentTree.value) return [];

  return getNodeComponents(selectedNode.value.id);
});
</script>

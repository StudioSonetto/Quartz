<template>
  <div class="inspector border-r">
    <template v-if="activeTab === 'editor'">
      <AtelierInspectorViewHierarchy />
      <div class="whitespace"></div>
      <AtelierInspectorViewProperties />
    </template>

    <template v-if="activeTab === 'assets'">
      <AtelierInspectorViewAssets />
    </template>

    <template v-if="activeTab === 'exports'">
      <AtelierInspectorViewExports />
    </template>
  </div>
</template>

<style scoped lang="postcss">
.inspector {
  @apply bg-dark-700 w-[25vw] p-[2ch];
  @apply flex flex-col flex-shrink-0;

  .hierarchy,
  .properties {
    @apply flex-1 min-h-0 overflow-y-clip;
  }
}
</style>

<script setup lang="ts">
const { activeTab } = storeToRefs(useAtelierStore());
</script>

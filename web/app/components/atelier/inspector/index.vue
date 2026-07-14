<template>
  <div class="inspector border-r">
    <template v-if="activeTab === 0">
      <AtelierInspectorViewHierarchy />
      <div class="whitespace"></div>
      <AtelierInspectorViewProperties />
    </template>

    <template v-if="activeTab === 1">
      <AtelierInspectorViewAssets />
    </template>

    <template v-if="activeTab === 2">
      <AtelierInspectorViewExports />
    </template>
  </div>
</template>

<style scoped lang="postcss">
.inspector {
  @apply bg-dark-700 w-[30vw] p-[2.5ch];
  @apply flex flex-col flex-shrink-0;

  .hierarchy,
  .properties {
    @apply flex-1 overflow-y-hidden;
  }
}
</style>

<script setup lang="ts">
const { activeTab } = storeToRefs(useAtelierStore());
</script>

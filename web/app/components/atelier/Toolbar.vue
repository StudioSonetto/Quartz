<template>
  <aside class="toolbar border-r">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.name"
      @click="setActiveTab(index)"
    >
      <div :class="[tab.icon, { 'opacity-60': index !== activeTab }]"></div>
    </button>
  </aside>
</template>

<style scoped lang="postcss">
aside {
  @apply bg-dark-500 w-[80px];
  @apply flex flex-col flex-shrink-0;

  button {
    @apply w-full h-20;
    @apply flex justify-center items-center transition-colors;
    @apply hover-bg-light-200 hover-text-dark-500;

    [class*="i-"] {
      @apply ui-text-5 transition-opacity;
    }
  }
}
</style>

<script setup lang="ts">
const { tabs, activeTab } = storeToRefs(useAtelierStore());
const { setActiveTab } = useAtelierStore();
</script>

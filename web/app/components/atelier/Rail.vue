<template>
  <aside class="rail border-r">
    <UIButton
      v-for="tab in tabs"
      :key="tab.id"
      variant="nav"
      @click="setActiveTab(tab.id)"
    >
      <div :class="[tab.icon, { 'opacity-60': tab.id !== activeTab }]"></div>
    </UIButton>
  </aside>
</template>

<style scoped lang="postcss">
.rail {
  @apply bg-dark-500 w-16;
  @apply flex flex-col flex-shrink-0;

  button {
    [class*="i-"] {
      @apply transition-opacity duration-200!;
    }
  }
}
</style>

<script setup lang="ts">
const { tabs, activeTab } = storeToRefs(useAtelierStore());
const { setActiveTab } = useAtelierStore();
</script>

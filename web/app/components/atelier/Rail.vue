<template>
  <aside class="rail border-r">
    <UIButton
      v-for="(tab, index) in tabs"
      :key="tab.name"
      variant="nav"
      @click="setActiveTab(index)"
    >
      <div :class="[tab.icon, { 'opacity-60': index !== activeTab }]"></div>
    </UIButton>
  </aside>
</template>

<style scoped lang="postcss">
.rail {
  @apply bg-dark-500 w-[80px];
  @apply flex flex-col flex-shrink-0;

  button {
    [class*="i-"] {
      @apply transition-opacity! duration-200;
    }
  }
}
</style>

<script setup lang="ts">
const { tabs, activeTab } = storeToRefs(useAtelierStore());
const { setActiveTab } = useAtelierStore();
</script>

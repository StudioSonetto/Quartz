<template>
  <div class="bar" @contextmenu.prevent>
    <UIButton
      v-for="tool in tools"
      :key="tool.id"
      variant="chip"
      @click="run(tool.id)"
    >
      <div
        :class="[
          tool.icon,
          { 'opacity-60': tool.id !== `core.tool.${activeTool}` },
        ]"
      ></div>
    </UIButton>
    <AtelierSelectionActions />
  </div>
</template>

<style scoped lang="postcss">
.bar {
  @apply flex items-center gap-4;
  @apply py-1;
  @apply text-light-200;
}
</style>

<script setup lang="ts">
const { activeTool } = storeToRefs(useAtelierStore());
const { run } = useCommands();

const tools = allCommands().filter((c) => c.category === "Tools");
</script>

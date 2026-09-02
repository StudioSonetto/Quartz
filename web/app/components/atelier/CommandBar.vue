<template>
  <div class="bar" @contextmenu.prevent>
    <UIButton
      v-for="tool in tools"
      :key="tool.id"
      variant="chip"
      :title="tool.title"
      @click="run(tool.id)"
    >
      <div
        :class="[
          tool.icon,
          { 'opacity-60': tool.id !== `core.tool.${activeTool}` },
        ]"
      ></div>
    </UIButton>
    <div class="divider"></div>
    <AtelierSelectionActions />
  </div>
</template>

<style scoped lang="postcss">
.bar {
  @apply flex flex-wrap items-center gap-1;

  .divider {
    @apply w-px h-4 mx-1 bg-dark-200;
  }
}
</style>

<script setup lang="ts">
const { activeTool } = storeToRefs(useAtelierStore());
const { run } = useCommands();

const tools = allCommands().filter((c) => c.category === "Tools");
</script>

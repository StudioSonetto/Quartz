<template>
  <div class="bar" @contextmenu.prevent>
    <Tooltip v-for="tool in tools" :key="tool.id" :description="tool.label">
      <UIButton variant="chip" @click="run(tool.id)">
        <div
          :class="[
            tool.icon,
            { 'opacity-60': tool.id !== `core.tool.${activeTool}` },
          ]"
        ></div>
      </UIButton>
    </Tooltip>
    <div class="divider"></div>
    <AtelierSelectionActions />
  </div>
</template>

<style scoped lang="postcss">
.bar {
  @apply flex flex-wrap items-center gap-1;

  button [class*="i-"] {
    @apply transition-opacity duration-200!;
  }

  .divider {
    @apply w-px h-4 mx-1 bg-dark-200;
  }
}
</style>

<script setup lang="ts">
const { activeTool } = storeToRefs(useAtelierStore());
const { run } = useCommands();

const tools = allCommands()
  .filter((c) => c.category === "Tools")
  .map((c) => ({
    ...c,
    label: c.keys ? `${c.title} (${c.keys[0]!.toUpperCase()})` : c.title,
  }));
</script>

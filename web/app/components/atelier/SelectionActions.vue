<template>
  <div class="actions" @contextmenu.prevent>
    <div class="buttons">
      <button
        v-for="a in buttons"
        :key="a.id"
        :title="a.title"
        :disabled="!a.enabled"
        @click="run(a.id)"
      >
        <span :class="a.icon"></span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.actions {
  @apply flex items-center gap-3;
}

.buttons {
  @apply flex flex-wrap gap-1;

  button {
    @apply flex items-center justify-center;
    @apply w-7 h-7 border-rd;
    @apply ui-text-4;
    @apply bg-dark-800 text-light-200;

    &:hover:not(:disabled) {
      @apply bg-light-200 text-dark-800;
    }

    &:disabled {
      @apply opacity-40 cursor-not-allowed;
    }
  }
}
</style>

<script setup lang="ts">
const { enabledCommands, run } = useCommands();

const IDS = [
  "core.selection.align.left",
  "core.selection.align.centreH",
  "core.selection.align.right",
  "core.selection.align.top",
  "core.selection.align.middleV",
  "core.selection.align.bottom",
  "core.selection.distribute.h",
  "core.selection.distribute.v",
  "core.selection.group",
  "core.selection.ungroup",
  "core.selection.duplicate",
];

const buttons = computed(() => {
  const byId = new Map(enabledCommands.value.map((c) => [c.command.id, c]));

  return IDS.map((id) => {
    const entry = byId.get(id);
    return {
      id,
      title: entry?.command.title ?? id,
      icon: entry?.command.icon ?? "i-carbon-help",
      enabled: entry?.enabled ?? false,
    };
  });
});
</script>

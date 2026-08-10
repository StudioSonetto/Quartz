<template>
  <div class="actions" @contextmenu.prevent>
    <div class="buttons">
      <UIButton
        v-for="a in buttons"
        :key="a.id"
        variant="chip"
        :title="a.title"
        :disabled="!a.enabled"
        @click="run(a.id)"
      >
        <div :class="a.icon"></div>
      </UIButton>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.actions {
  @apply flex items-center gap-3;

  .buttons {
    @apply flex flex-wrap gap-1;
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

<template>
  <UIButton
    v-for="{ command, enabled } in buttons"
    :key="command.id"
    variant="chip"
    :title="command.title"
    :disabled="!enabled"
    @click="run(command.id)"
  >
    <div :class="command.icon"></div>
  </UIButton>
</template>

<script setup lang="ts">
const { enabledCommands, run } = useCommands();

const buttons = computed(() =>
  enabledCommands.value
    .filter(({ command }) => command.menu?.selection !== undefined)
    .sort((a, b) => a.command.menu!.selection! - b.command.menu!.selection!),
);
</script>

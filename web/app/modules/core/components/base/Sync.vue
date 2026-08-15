<template>
  <NodeComponentRow v-if="channels.length" name="sync">
    <NodeComponentRowFieldRadio
      toggle-mode
      :value="synced"
      :options="channels"
      @update:value="commit"
    />
  </NodeComponentRow>
</template>

<script setup lang="ts">
const props = defineProps<{
  nodes: Tree[];
}>();

const deck = useDeckStore();

const channels = computed(() => {
  if (!props.nodes.length || props.nodes.some((n) => !n.reference)) return [];

  const ids = new Set(props.nodes.map((n) => n.id));
  const types = new Set<ComponentType>();

  for (const c of deck.currentComponents ?? [])
    if (ids.has(c.node)) types.add(c.type);

  return [
    { value: "name" as SyncChannel, label: "name", icon: "i-carbon-tag" },
    ...[...types].map((type) => ({
      value: type as SyncChannel,
      label: type.split(".").at(-1) ?? type,
      icon: getComponentType(type)?.icon ?? "i-carbon-help",
    })),
  ];
});

const synced = computed(() =>
  channels.value
    .map((c) => c.value)
    .filter((key) => props.nodes.every((n) => syncs(n, key))),
);

function commit(next: string | string[]) {
  const on = new Set(Array.isArray(next) ? next : [next]);
  const shown = new Set<string>(channels.value.map((c) => c.value));
  const off = [...shown].filter((key) => !on.has(key));

  for (const node of props.nodes) {
    const hidden = unsyncedOf(node).filter((key) => !shown.has(key));

    deck.updateNode(node.id, { unsynced: [...hidden, ...off] });
  }
}
</script>

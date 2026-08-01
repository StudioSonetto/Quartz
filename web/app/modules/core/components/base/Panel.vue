<template>
  <NodeComponent name="base" :icon="props.icon">
    <NodeComponentRow name="reference">
      <NodeComponentRowFieldText
        :value="mergedReference"
        :disabled="allRoot"
        @update:value="writeReference"
      />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { updateNode } = useDeckStore();

// Reference lives on the node, not component data. Blank ("") when the nodes
// disagree; root keeps its identity and is never written.
const mergedReference = computed(() =>
  allEqual(
    props.nodes.map((n) => n.reference ?? ""),
    "",
  ),
);

const allRoot = computed(() => props.nodes.every((n) => n.path === ROOT_PATH));

function writeReference(value: string) {
  for (const n of props.nodes) {
    if (n.path === ROOT_PATH) continue;

    updateNode(n.id, { reference: value });
  }
}
</script>

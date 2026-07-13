<template>
  <NodeComponent name="base">
    <NodeComponentRow name="reference">
      <NodeComponentRowFieldText v-model:value="reference" :disabled="isRoot" />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
const { updateNode } = useDeckStore();
const { selectedNode } = storeToRefs(useDeckStore());

const isRoot = computed(() => selectedNode.value?.path === "root");

const reference = computed({
  get() {
    return selectedNode.value?.reference ?? "";
  },
  set(value) {
    if (isRoot.value || !selectedNode.value) return;

    updateNode(selectedNode.value.id, { reference: value });
  },
});
</script>

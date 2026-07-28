<template>
  <NodeComponent name="base" :icon="props.icon">
    <NodeComponentRow name="reference">
      <NodeComponentRowFieldText v-model:value="reference" :disabled="isRoot" />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string;
}>();

const { updateNode } = useDeckStore();
const { soleSelected } = storeToRefs(useDeckStore());

const isRoot = computed(() => soleSelected.value?.path === "root");

const reference = computed({
  get() {
    return soleSelected.value?.reference ?? "";
  },
  set(value) {
    if (isRoot.value || !soleSelected.value) return;

    updateNode(soleSelected.value.id, { reference: value });
  },
});
</script>

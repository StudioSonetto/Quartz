<template>
  <Modal ref="modal" title="Add component">
    <div class="options">
      <UIButton
        v-for="def in props.available"
        :key="def.type"
        variant="menu"
        @click="add(def.type)"
      >
        <div :class="def.icon"></div>
        {{ label(def.type) }}
      </UIButton>
    </div>
  </Modal>
</template>

<style scoped lang="postcss">
.options {
  @apply flex flex-col gap-1;
}
</style>

<script setup lang="ts">
const props = defineProps<{ available: ComponentTypeDef[] }>();

const deck = useDeckStore();
const { selectedNodes } = storeToRefs(deck);

const modal = ref<{ open: () => void; close: () => void }>();

const label = (type: ComponentType) => type.split(".").at(-1) ?? type;

function add(type: ComponentType) {
  for (const node of selectedNodes.value) deck.addComponent(node.id, type);

  modal.value?.close();
}

defineExpose({ open: () => modal.value?.open() });
</script>

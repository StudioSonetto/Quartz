<template>
  <Modal ref="modal" title="Shared node" @close="onDismiss">
    <p class="prompt">
      <strong>{{ props.linkKey }}</strong> is already used by
      {{ props.peerCount }}
      {{ props.peerCount === 1 ? "node" : "nodes" }} with different settings.
      Shared nodes must match.
    </p>
    <template #footer>
      <UIButton variant="ghost" @click="choose('cancel')">Cancel</UIButton>
      <UIButton variant="ghost" @click="choose('adopt')">Adopt</UIButton>
      <UIButton @click="choose('push')">Push</UIButton>
    </template>
  </Modal>
</template>

<style scoped lang="postcss">
.prompt {
  @apply ui-text-4 max-w-[28rem];

  strong {
    @apply font-600;
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{ linkKey: string; peerCount: number }>();

const emit = defineEmits<{ resolve: [choice: "adopt" | "push" | "cancel"] }>();

const modal = ref<{ open: () => void; close: () => void }>();
const resolved = ref(false);

function choose(choice: "adopt" | "push" | "cancel") {
  resolved.value = true;
  modal.value?.close();
  emit("resolve", choice);
}

function onDismiss() {
  if (resolved.value) {
    resolved.value = false;

    return;
  }

  emit("resolve", "cancel");
}

defineExpose({ open: () => modal.value?.open() });
</script>

<template>
  <dialog ref="modal" @close="emit('close')">
    <div class="modal-header">
      <h4>{{ props.title }}</h4>
      <UIButton variant="icon" @click="close" aria-label="Close">
        <div class="i-carbon-close"></div>
      </UIButton>
    </div>
    <div class="modal-body">
      <slot />
    </div>
  </dialog>
</template>

<style scoped lang="postcss">
dialog {
  @apply absolute top-1/2 left-1/2;
  @apply translate-x-[-50%] translate-y-[-50%];
  @apply border-2 border-dark-200 border-rd;
  @apply bg-dark-900 text-light-200 select-none;
  @apply min-w-sm;

  .modal-header {
    @apply flex items-center justify-between;
    @apply p-6;

    h4 {
      @apply ui-text-4;
    }
  }

  .modal-body {
    @apply p-6;
  }

  &::backdrop {
    @apply bg-dark-900/60;
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  title: string;
}>();

const modal = useTemplateRef<HTMLDialogElement>("modal");

const emit = defineEmits<{
  close: [];
}>();

const close = () => {
  modal.value?.close();
};

defineExpose({
  open: () => modal.value?.showModal(),
  close,
});
</script>

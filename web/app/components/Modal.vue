<template>
  <dialog ref="modal" @close="emit('close')">
    <div v-if="!props.isMinimal" class="modalHeader">
      <h4>{{ props.title }}</h4>
      <UIButton variant="ghost" size="sm" @click="close" aria-label="Close">
        <div class="i-carbon-close"></div>
      </UIButton>
    </div>
    <div class="modalBody">
      <slot />
    </div>
    <div v-if="$slots.footer" class="modalFooter">
      <slot name="footer" />
    </div>
  </dialog>
</template>

<style scoped lang="postcss">
dialog {
  @apply absolute top-1/2 left-1/2;
  @apply translate-x-[-50%] translate-y-[-50%];
  @apply border-2 border-dark-200 border-rd;
  @apply bg-dark-900 text-light-200 select-none;
  @apply min-w-[24rem];

  &::backdrop {
    @apply bg-dark-900/60;
  }
}

dialog[open] {
  @apply flex flex-col;
}

.modalHeader {
  @apply flex items-center justify-between;
  @apply px-6 h-14;
  @apply border-solid border-0 border-b-1 border-dark-200;

  h4 {
    @apply ui-text-4 font-500;
  }

}

.modalBody {
  @apply px-6 py-8;
}

.modalFooter {
  @apply flex items-center justify-end gap-2;
  @apply px-6 h-14;
  @apply border-solid border-0 border-t-1 border-dark-200;
}
</style>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  isMinimal?: boolean;
}>();

const modal = ref<HTMLDialogElement>();

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

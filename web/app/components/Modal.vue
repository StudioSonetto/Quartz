<template>
  <dialog ref="modal" @transitionend.self="onTransitionEnd">
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
  @apply min-w-sm border-2 border-dark-200 border-rd;
  @apply bg-dark-900 text-light-200 select-none;
  @apply opacity-0 scale-95;
  @apply transition-all transition-discrete;

  &[open] {
    @apply opacity-100 scale-100;
  }

  &::backdrop {
    @apply bg-transparent;
    @apply transition-all transition-discrete;
  }

  &[open]::backdrop {
    @apply bg-dark-900/60;
  }

  .modal-header {
    @apply flex items-center justify-between p-6;

    h4 {
      @apply ui-text-4;
    }
  }

  .modal-body {
    @apply p-6;
  }
}

@starting-style {
  dialog[open] {
    @apply opacity-0 scale-95;
  }

  dialog[open]::backdrop {
    @apply bg-transparent;
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

const onTransitionEnd = (e: TransitionEvent) => {
  if (e.propertyName === "opacity" && !modal.value?.open) emit("close");
};

defineExpose({
  open: () => modal.value?.showModal(),
  close,
});
</script>

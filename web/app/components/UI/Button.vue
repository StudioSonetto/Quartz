<template>
  <button :type="type" :class="[variant, size]" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped lang="postcss">
button {
  @apply flex justify-center items-center gap-2;
  @apply bg-transparent border-rd transition-all ui-text-3;

  [class*="i-"] {
    @apply ui-text-4;
  }

  &:disabled {
    @apply opacity-50 pointer-events-none;
  }
}

.primary {
  @apply border-solid border-1 border-light-200;
  @apply hover:bg-light-200 hover:text-dark-900;
  @apply active:opacity-80;
}

.ghost {
  @apply text-light-200/60 hover:bg-light-200/8 hover:text-light-200;
  @apply active:opacity-80;
}

.danger {
  @apply border-solid border-1 border-red-500 text-red-500;
  @apply hover:bg-red-500 hover:text-white;
  @apply active:opacity-80;
}

.sm {
  @apply px-3 py-1.5;
}

.md {
  @apply px-4 py-2;
}

.lg {
  @apply px-6 py-3;
}
</style>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "primary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "primary",
    size: "md",
    disabled: false,
    type: "button",
  },
);
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="to ? undefined : disabled"
    class="ui-button"
    :class="[`ui-button--${variant}`, { 'ui-button--danger': danger }]"
  >
    <slot />
  </component>
</template>

<style scoped lang="postcss">
.ui-button {
  @apply flex justify-center items-center gap-2;
  @apply bg-transparent border-rd;
  @apply no-underline text-inherit cursor-pointer;
  @apply transition-all;

  &:disabled {
    @apply opacity-50 pointer-events-none;
  }
}

.ui-button--primary {
  @apply border-solid border-1 border-light-200/60;
  @apply px-6 py-3 ui-text-3;
  @apply hover:bg-light-200 hover:text-dark-900;
  @apply active:opacity-80;
}

.ui-button--solid {
  @apply border-solid border-1 border-light-200/90;
  @apply bg-light-200/90 text-dark-900;
  @apply px-6 py-3;
  @apply hover:bg-light-200;
  @apply active:opacity-80;
}

.ui-button--ghost {
  @apply p-3;
  @apply text-light-200/60 hover:bg-light-200/8 hover:text-light-200;
  @apply active:opacity-80;
}

.ui-button--icon {
  @apply p-0 ui-text-5;
  @apply text-light-200;
  @apply active:opacity-80;
}

.ui-button--nav {
  @apply w-20 h-20 rounded-none;
  @apply ui-text-5;
  @apply hover:bg-light-200 hover:text-dark-500;
}

.ui-button--chip {
  @apply w-7 h-7;
  @apply bg-dark-800 text-light-200;
  @apply hover:bg-light-200 hover:text-dark-800;
}

.ui-button--menu {
  @apply w-full h-12 px-4 justify-start rounded-none;
  @apply border-solid border-0 border-b-1 border-dark-200;
  @apply hover:bg-light-200 hover:text-dark-900;
}

.ui-button--danger {
  @apply text-red-500;
  @apply hover:bg-red-500 hover:text-white;
}

.ui-button--primary.ui-button--danger,
.ui-button--solid.ui-button--danger {
  @apply border-red-500;
}
</style>

<script setup lang="ts">
import { NuxtLink } from "#components";

withDefaults(
  defineProps<{
    variant?: "primary" | "solid" | "ghost" | "icon" | "nav" | "chip" | "menu";
    danger?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    to?: string;
  }>(),
  {
    variant: "primary",
    danger: false,
    disabled: false,
    type: "button",
  },
);
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Analytics />
</template>

<style lang="postcss">
::selection {
  @apply bg-light-200 text-dark-900;
}

* {
  @apply m-0 p-0 box-border;
  @apply font-azeret-mono outline-none;
}

a,
button {
  @apply bg-transparent decoration-none border-none;
  @apply text-light-200 cursor-pointer select-none;
}

img {
  @apply select-none;
}

input,
textarea {
  @apply bg-transparent border-none transition-colors;
  @apply text-light-200 py-4 ui-text-3;
  @apply border-solid border-0 border-b-1 border-neutral-500;
}

input::placeholder,
textarea::placeholder {
  @apply text-neutral-500;
}

input[type="color"] {
  @apply w-full h-auto;
  @apply cursor-pointer;

  &::-webkit-color-swatch-wrapper {
    @apply p-0;
  }

  &::-webkit-color-swatch {
    @apply border-none;
  }
}

fieldset {
  @apply border-none;
}

form {
  @apply flex flex-col;

  > * {
    @apply my-2;
  }

  > *:first-child {
    @apply mt-0;
  }
}

main {
  @apply min-h-screen;
  @apply bg-dark-900 text-light-200;
  @apply overflow-x-hidden;
}

section {
  @apply h-screen;
}

select {
  @apply bg-transparent appearance-none;
  @apply border-0! border-b-1! border-light-200;
  @apply ui-text-3 text-light-200
  @apply py-4 cursor-pointer;

  option {
    @apply bg-dark-500 text-light-200;
  }
}

textarea {
  @apply resize-none;
}

.absolute-center {
  @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
}

.border-r {
  @apply border-solid border-0 border-r-2 border-dark-200;
}

.disabled {
  @apply opacity-50 pointer-events-none transition-opacity;
}

.fade-enter-from {
  @apply opacity-0;
}

.fade-enter-to {
  @apply opacity-100;
}

.fade-enter-active {
  @apply transition-opacity duration-500;
}

.sortable-ghost {
  @apply opacity-0;
}

.whitespace {
  @apply h-6;
}
</style>

<script setup lang="ts">
import { Analytics } from "@vercel/analytics/nuxt";
</script>

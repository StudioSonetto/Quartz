<template>
  <Transition name="atelier-notice">
    <div v-if="atelier.notice" class="atelier-notice" role="status">
      {{ atelier.notice }}
    </div>
  </Transition>
</template>

<style scoped lang="postcss">
.atelier-notice {
  @apply fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ui-text-3;
  @apply px-4 py-2 bg-dark-900 text-light-200 pointer-events-none;
  @apply border-solid border-2 border-dark-200 border-rd;
}

.atelier-notice-enter-active,
.atelier-notice-leave-active {
  transition: opacity 0.15s;
}

.atelier-notice-enter-from,
.atelier-notice-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
const atelier = useAtelierStore();
</script>

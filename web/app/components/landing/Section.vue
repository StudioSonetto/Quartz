<template>
  <section>
    <h2>{{ props.title }}/</h2>
    <div class="whitespace"></div>
    <p class="opacity-60 font-400">{{ props.description }}</p>
    <div class="whitespace"></div>
    <div class="whitespace"></div>
    <div class="whitespace"></div>
    <slot />
  </section>
</template>

<style scoped lang="postcss">
section {
  @apply px-80 py-30;

  h2 {
    @apply uppercase font-100 text-4xl;
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  description: string;
}>();
</script>

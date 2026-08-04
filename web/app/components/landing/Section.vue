<template>
  <section>
    <h2>{{ props.title }}</h2>
    <div class="whitespace"></div>
    <p>{{ props.description }}</p>
    <div class="whitespace"></div>
    <div class="whitespace"></div>
    <slot />
  </section>
</template>

<style scoped lang="postcss">
section {
  @apply min-h-screen px-90 py-30;

  h2 {
    @apply uppercase font-100 text-6xl;
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  description: string;
}>();
</script>

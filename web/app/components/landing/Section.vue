<template>
  <section :id="props.title.toLowerCase()">
    <div v-if="props.title && props.description" class="info">
      <h2 class="title">{{ props.title }}/</h2>
      <div class="whitespace"></div>
      <p class="description">{{ props.description }}</p>
      <div class="whitespace"></div>
      <div class="whitespace"></div>
      <div class="whitespace"></div>
    </div>
    <slot />
  </section>
</template>

<style scoped lang="postcss">
section {
  @apply px-20 xl:px-40 2xl:px-60 3xl:px-80 py-30;

  .info {
    .title {
      @apply uppercase font-400 text-4xl;
    }

    .description {
      @apply text-light-200/60;
    }
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  description?: string;
}>();
</script>

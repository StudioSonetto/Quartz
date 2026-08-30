<template>
  <section :id="props.title.toLowerCase()">
    <div v-if="props.title && props.description" class="info">
      <h2 class="title">{{ props.title }}/</h2>
      <p class="description">{{ props.description }}</p>
    </div>
    <slot />
  </section>
</template>

<style scoped lang="postcss">
section {
  @apply ui-section;

  .info {
    @apply mb-18;

    .title {
      @apply uppercase font-400 text-4xl;
    }

    .description {
      @apply mt-6 text-light-200/60;
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

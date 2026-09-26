<template>
  <section>
    <div v-if="props.description || $slots.description" class="info">
      <h2 class="title">{{ props.title }}/</h2>
      <p class="description">
        <slot name="description">{{ props.description }}</slot>
      </p>
    </div>
    <slot />
  </section>
</template>

<style scoped lang="postcss">
section {
  @apply ui-section;

  .info {
    @apply mb-12;

    .title {
      @apply uppercase font-300 ui-text-6;
    }

    .description {
      @apply mt-6 text-light-200/60 ui-text-4;

      :slotted(a) {
        @apply underline underline-offset-4 transition-colors;
        @apply hover:text-light-200/80;
      }
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

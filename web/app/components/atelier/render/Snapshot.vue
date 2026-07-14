<template>
  <div v-if="url" class="snapshot">
    <NuxtImg
      :src="url"
      :alt="`snapshot of ${props.deck}`"
      loading="lazy"
      class="snapshot"
    />
  </div>
</template>

<style scoped lang="postcss">
.snapshot {
  @apply relative w-full aspect-video border-rd;

  img {
    @apply absolute inset-0 p-0.5;
  }
}
</style>

<script setup lang="ts">
const { fetchSlides } = useDeckStore();

const props = defineProps<{
  deck: string;
  slides?: string;
}>();

// TODO: Replace with useAsyncData.
const url = asyncComputed(async () => {
  const slideId = props.slides ?? (await fetchSlides(props.deck, 0)).id;

  return await useSnapshot().fetch(props.deck, slideId);
});
</script>

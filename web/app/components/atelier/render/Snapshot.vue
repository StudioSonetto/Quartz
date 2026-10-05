<template>
  <div class="snapshot" :class="{ 'snapshot-empty': !url }">
    <NuxtImg
      v-if="url"
      :src="url"
      :alt="`snapshot of ${props.deck}`"
      loading="lazy"
    />
  </div>
</template>

<style scoped lang="postcss">
.snapshot {
  @apply relative w-full h-full;

  &.snapshot-empty {
    @apply bg-light-200;
  }

  img {
    @apply absolute w-full h-full object-cover;
  }
}
</style>

<script setup lang="ts">
const { snapshotUrl, coverUrl } = useSnapshotsStore();

const props = defineProps<{
  deck: string;
  slides?: string;
}>();

const url = computed(() =>
  props.slides ? snapshotUrl(props.slides) : coverUrl(props.deck),
);
</script>

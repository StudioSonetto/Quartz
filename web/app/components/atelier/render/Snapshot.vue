<template>
  <div class="snapshot" :class="{ 'snapshot-empty': !url && props.slides }">
    <NuxtImg
      v-if="url"
      :src="url"
      :alt="`snapshot of ${props.deck}`"
      :class="{ 'snapshot-loaded': loaded }"
      loading="lazy"
      @load="loaded = true"
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
    @apply opacity-0;

    &.snapshot-loaded {
      @apply opacity-100 animate-fade-in;
    }
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

const loaded = ref(false);
</script>

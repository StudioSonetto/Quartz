<template>
  <video
    v-if="props.video"
    ref="video"
    class="element-media"
    :src="props.url"
    :style="{ objectFit: props.fit }"
    crossorigin="anonymous"
    playsinline
    preload="auto"
  />
  <img
    v-else
    class="element-media"
    :src="props.url"
    :style="{ objectFit: props.fit }"
    crossorigin="anonymous"
    draggable="false"
  />
</template>

<style scoped lang="postcss">
.element-media {
  @apply absolute inset-0 w-full h-full pointer-events-none select-none;
}
</style>

<script setup lang="ts">
const props = defineProps<{
  url: string;
  video: boolean;
  fit: string;
  timing: MediaTiming;
  presenting: boolean;
}>();

const video = useTemplateRef<HTMLVideoElement>("video");

watch(
  video,
  (el, _, onCleanup) => {
    if (!el) return;

    onCleanup(
      useMediaClock(el, {
        timing: () => props.timing,
        audible: () => props.presenting,
      }),
    );
  },
  { immediate: true },
);
</script>

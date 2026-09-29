<template>
  <video
    v-if="props.video"
    ref="video"
    class="element-media"
    :src="props.url"
    :style="{ objectFit: props.fit }"
    crossorigin="anonymous"
    playsinline
    :preload="props.presenting ? 'auto' : 'metadata'"
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
  fit: "cover" | "contain" | "fill";
  timing: MediaTiming;
  presenting: boolean;
  node: string;
  anim?: any;
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
        onLength: (ms) => {
          if (!props.presenting) saveMediaLength(props.node, "core.media", ms);
        },
        anim: () => props.anim,
      }),
    );
  },
  { immediate: true },
);
</script>

<template>
  <div class="dopesheet-ruler">
    <div
      class="dopesheet-ruler-time"
      role="slider"
      tabindex="0"
      aria-label="Playhead"
      :aria-valuemin="0"
      :aria-valuemax="duration"
      :aria-valuenow="Math.round(props.shownTime)"
      @pointerdown="startScrub"
      @keydown.left.prevent="seek(roundTime(props.shownTime) - step($event))"
      @keydown.right.prevent="seek(roundTime(props.shownTime) + step($event))"
    >
      <span
        v-for="tick in ticks.minor"
        :key="tick"
        class="dopesheet-ruler-minor"
        :style="{ left: timePercent(tick, view) }"
      />
      <span
        v-for="tick in ticks.major"
        :key="tick"
        class="dopesheet-ruler-major"
        :style="{ left: timePercent(tick, view) }"
      >
        {{ +(tick / 1000).toFixed(2) }}s
      </span>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.dopesheet-ruler {
  @apply flex-1 min-w-0 h-full px-[var(--dopesheet-pad)];

  .dopesheet-ruler-time {
    @apply relative h-full outline-none cursor-pointer;
  }

  .dopesheet-ruler-minor,
  .dopesheet-ruler-major {
    @apply absolute bottom-0 pointer-events-none;
  }

  .dopesheet-ruler-minor {
    @apply w-px h-1 bg-light-200/15;
  }

  .dopesheet-ruler-major {
    @apply h-full pl-2 pt-1;
    @apply border-solid border-0 border-l-1 border-light-200/25;
    @apply ui-text-3 leading-none tabular-nums whitespace-nowrap;
    @apply text-light-200/60;
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{ shownTime: number }>();

const { duration, view, seek } = usePlayhead();

const ticks = computed(() => rulerTicks(view));

const startTimeDrag = useTimeDrag();

function startScrub(event: PointerEvent) {
  if (event.button !== 0) return;

  event.preventDefault();

  const box = (event.currentTarget as HTMLElement).getBoundingClientRect();

  startTimeDrag(event, box, seek)();
}

const step = (event: KeyboardEvent) => (event.shiftKey ? 1000 : 100);
</script>

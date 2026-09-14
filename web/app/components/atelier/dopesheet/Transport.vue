<template>
  <div class="dopesheet-transport">
    <div class="dopesheet-transport-controls">
      <UIButton
        variant="icon"
        :disabled="!playable"
        :aria-label="playing ? 'Pause' : 'Play'"
        @click="toggle"
      >
        <div :class="playing ? 'i-carbon-pause' : 'i-carbon-play'"></div>
      </UIButton>
      <UIButton
        variant="icon"
        :disabled="!canPlay"
        aria-label="Stop"
        @click="reset"
      >
        <div class="i-carbon-stop"></div>
      </UIButton>
      <p class="dopesheet-readout">{{ (time / 1000).toFixed(2) }}s</p>
    </div>
    <div
      class="dopesheet-scrub"
      role="slider"
      tabindex="0"
      aria-label="Playhead"
      :aria-valuemin="0"
      :aria-valuemax="duration"
      :aria-valuenow="Math.round(time)"
      @pointerdown="startScrub"
      @keydown.left.prevent="seek(time - step($event))"
      @keydown.right.prevent="seek(time + step($event))"
    >
      <div
        class="dopesheet-scrub-thumb"
        :style="{ left: timePercent(time, duration) }"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.dopesheet-transport {
  @apply flex items-center gap-3 pt-6 pb-3 px-[var(--dopesheet-gutter)];
  @apply overflow-hidden [scrollbar-gutter:stable];

  .dopesheet-transport-controls {
    @apply flex items-center gap-2 shrink-0 w-[var(--dopesheet-label)];
  }

  /* Same flex-1 track as a lane, so thumb, line and keys share one scale. */
  .dopesheet-scrub {
    @apply relative flex-1 h-4 cursor-pointer;

    &::before {
      @apply content-[''] absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2;
      @apply border-rd bg-dark-200;
    }

    &:focus-visible {
      @apply outline outline-1 outline-offset-2 outline-accent;
    }
  }

  .dopesheet-scrub-thumb {
    @apply absolute top-1/2 w-2.5 h-2.5 border-rd bg-accent;
    @apply -translate-x-1/2 -translate-y-1/2;
  }

  .dopesheet-readout {
    @apply ui-text-3 tabular-nums opacity-60 m-0;
  }
}
</style>

<script setup lang="ts">
const { time, playing, duration, canPlay, playable, toggle, seek, reset } =
  usePlayhead();

const drag = usePointerDrag();

function startScrub(event: PointerEvent) {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const to = (e: PointerEvent) =>
    seek(timeAtPointer(box, e.clientX, duration.value));

  event.preventDefault();
  drag.start(null, to);
  to(event);
}

const step = (event: KeyboardEvent) => (event.shiftKey ? 1000 : 100);
</script>

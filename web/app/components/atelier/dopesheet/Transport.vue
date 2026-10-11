<template>
  <div class="dopesheet-transport">
    <div class="dopesheet-transport-controls">
      <UIButton
        variant="icon"
        :disabled="!playable"
        :aria-label="playing ? 'Pause' : 'Play'"
        @click="playing ? emit('pause') : play()"
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
      <p class="dopesheet-readout">
        {{ readout }}
      </p>
    </div>
    <div
      class="dopesheet-scrub"
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
        v-for="tick in ticks"
        :key="tick"
        class="dopesheet-scrub-tick"
        :style="{ left: timePercent(tick, view) }"
      >
        {{ +(tick / 1000).toFixed(2) }}s
      </span>
      <div
        v-if="inView(props.shownTime, view)"
        class="dopesheet-scrub-thumb"
        :style="{ left: timePercent(props.shownTime, view) }"
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

  .dopesheet-scrub-tick {
    @apply absolute bottom-full -translate-x-1/2;
    @apply ui-text-3 tabular-nums opacity-40 pointer-events-none;
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
const props = defineProps<{
  rows: DopesheetRow[];
  shownTime: number;
  overrun: boolean;
}>();

const emit = defineEmits<{ pause: [] }>();

const { playing, duration, view, canPlay, playable, play, seek, reset } =
  usePlayhead();

const ticks = computed(() => {
  const rough = view.span / 6;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((n) => n * power).find((s) => s >= rough)!;
  const first = Math.ceil(view.start / step) * step;

  return Array.from(
    { length: Math.floor((view.start + view.span - first) / step) + 1 },
    (_, i) => first + i * step,
  );
});

const readout = computed(() => {
  if (draggedKeyTime.value !== null) return formatSeconds(draggedKeyTime.value);

  return props.overrun ? "looping" : formatSeconds(props.shownTime);
});

const startTimeDrag = useTimeDrag();

const SNAP_PX = 3;

const snapTargets = computed(() => props.rows.flatMap((row) => keyTimes(row)));

function startScrub(event: PointerEvent) {
  if (event.button !== 0) return;

  const box = (event.currentTarget as HTMLElement).getBoundingClientRect();

  const to = (t: number) =>
    seek(snapTime(t, snapTargets.value, (SNAP_PX / box.width) * view.span));

  event.preventDefault();
  startTimeDrag(event, box, null, to);
  to(timeAtPointer(box, event.clientX, view));
}

const step = (event: KeyboardEvent) => (event.shiftKey ? 1000 : 100);
</script>

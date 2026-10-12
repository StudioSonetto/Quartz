<template>
  <div class="dopesheet-transport">
    <div class="dopesheet-transport-group">
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
      <UIButton
        variant="icon"
        aria-label="Loop"
        :aria-pressed="looping"
        @click="toggleLoop"
      >
        <div
          :class="[
            'i-carbon-renew transition-opacity',
            !looping && 'opacity-60',
          ]"
        ></div>
      </UIButton>
      <p class="dopesheet-transport-readout">
        <span>{{ readout }}</span>
        <span class="dopesheet-transport-total">
          / {{ formatSeconds(end) }}
        </span>
      </p>
    </div>
    <div class="dopesheet-transport-group">
      <UIButton
        variant="icon"
        aria-label="Snap"
        :aria-pressed="timeSnapping"
        @click="toggleSnap"
      >
        <div
          :class="[
            'i-carbon-ruler transition-opacity',
            !timeSnapping && 'opacity-60',
          ]"
        ></div>
      </UIButton>
      <span class="dopesheet-transport-divider" />
      <UIButton variant="icon" aria-label="Zoom out" @click="zoomBy(1)">
        <div class="i-carbon-zoom-out"></div>
      </UIButton>
      <span class="dopesheet-transport-zoom">{{ percent }}%</span>
      <UIButton variant="icon" aria-label="Zoom in" @click="zoomBy(-1)">
        <div class="i-carbon-zoom-in"></div>
      </UIButton>
      <UIButton variant="icon" aria-label="Fit" @click="fit">
        <div class="i-carbon-fit-to-width"></div>
      </UIButton>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.dopesheet-transport {
  @apply flex items-center justify-between gap-4 shrink-0 h-12 px-4;
  @apply border-solid border-0 border-b-2 border-dark-200;

  .dopesheet-transport-group {
    @apply flex items-center gap-3;
  }

  .dopesheet-transport-readout {
    @apply flex gap-1.5 ml-2 px-3 py-1.5;
    @apply border-solid border-1 border-dark-200 border-rd;
    @apply ui-text-3 tabular-nums;
  }

  .dopesheet-transport-total {
    @apply opacity-60;
  }

  .dopesheet-transport-divider {
    @apply w-px h-4 mx-1 bg-dark-200;
  }

  .dopesheet-transport-zoom {
    @apply w-10 text-center ui-text-3 tabular-nums opacity-60;
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

const {
  playing,
  end,
  view,
  fitSpan,
  canPlay,
  playable,
  play,
  reset,
  zoom,
  fit,
} = usePlayhead();
const { patchAnimation } = useDeckStore();

const readout = computed(() => {
  if (draggedKeyTime.value !== null) return toSeconds(draggedKeyTime.value);

  return props.overrun ? "looping" : toSeconds(props.shownTime);
});

const looping = computed(() => props.rows.some((row) => row.loop));

function toggleLoop() {
  const loop = looping.value ? undefined : "on";

  for (const row of props.rows) patchAnimation(row.node, () => ({ loop }));
}

const toggleSnap = () => (timeSnapping.value = !timeSnapping.value);

const percent = computed(() => Math.round((fitSpan.value / view.span) * 100));

const zoomBy = (direction: number) =>
  zoom(direction * 150, view.start + view.span / 2, true);
</script>

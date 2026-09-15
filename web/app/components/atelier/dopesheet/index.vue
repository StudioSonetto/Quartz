<template>
  <div class="dopesheet">
    <AtelierDopesheetTransport
      :rows="rows"
      :shown-time="shownTime"
      :overrun="overrun"
      @pause="pauseHere"
    />
    <div class="dopesheet-scroll">
      <div class="dopesheet-rows">
        <div class="dopesheet-playhead">
          <div class="dopesheet-playhead-track">
            <div
              class="dopesheet-line"
              :style="{ left: timePercent(shownTime, duration) }"
            />
          </div>
        </div>
        <template v-for="row in rows" :key="row.node">
          <p class="dopesheet-node">{{ row.name }}:</p>
          <AtelierDopesheetLane
            v-if="row.stateKeys.length"
            state
            label="state"
            :keys="row.stateKeys"
            :duration="duration"
            @move="(from, to) => onMoveState(row.node, from, to)"
            @remove="(t) => onRemoveState(row.node, t)"
          />
          <AtelierDopesheetLane
            v-for="(track, i) in row.tracks"
            :key="i"
            :label="track.path.join('.')"
            :keys="track.keys"
            :duration="duration"
            @move="(from, to) => onMoveKey(row.node, track, from, to)"
            @remove="(t) => onRemoveKey(row.node, track, t)"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.dopesheet {
  @apply flex flex-col flex-1 min-h-0;
  @apply [--dopesheet-label:10rem] [--dopesheet-gutter:1.5rem];

  .dopesheet-scroll {
    @apply flex-1 overflow-y-auto [scrollbar-gutter:stable];
  }

  .dopesheet-rows {
    @apply relative pb-2 px-[var(--dopesheet-gutter)];
  }

  .dopesheet-node {
    @apply ui-text-3 my-3;
  }

  .dopesheet-playhead {
    @apply absolute inset-0 flex gap-3 px-[var(--dopesheet-gutter)];
    @apply pointer-events-none;

    &::before {
      @apply content-[''] w-[var(--dopesheet-label)];
    }
  }

  .dopesheet-playhead-track {
    @apply relative flex-1;
  }

  .dopesheet-line {
    @apply absolute inset-y-0 w-px bg-accent;
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{ rows: DopesheetRow[] }>();

const { patchAnimation } = useDeckStore();
const { duration } = usePlayhead();
const { shownTime, overrun, pauseHere } = usePlayheadDisplay(() => props.rows);

function onRemoveKey(node: string, track: Track, t: number) {
  patchAnimation(node, (data) => ({
    tracks: removeKey(data.tracks, track.type, track.path, t),
  }));
}

function onRemoveState(node: string, t: number) {
  patchAnimation(node, (data) => ({
    stateKeys: removeStateKey(data.stateKeys, t),
  }));
}

function onMoveKey(node: string, track: Track, from: number, to: number) {
  patchAnimation(node, (data) => ({
    tracks: moveTrackKey(data.tracks, track.type, track.path, from, to),
  }));
}

function onMoveState(node: string, from: number, to: number) {
  patchAnimation(node, (data) => ({
    stateKeys: moveKey(data.stateKeys, from, to),
  }));
}
</script>

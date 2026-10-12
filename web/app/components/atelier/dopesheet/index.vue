<template>
  <div class="dopesheet">
    <AtelierDopesheetTransport
      :rows="rows"
      :shown-time="shownTime"
      :overrun="overrun"
      @pause="pause"
    />
    <div class="dopesheet-body" @wheel="onWheel" @pointerdown="startPan">
      <div class="dopesheet-header">
        <p class="dopesheet-header-label">Tracks</p>
        <AtelierDopesheetRuler :shown-time="shownTime" />
      </div>
      <TransitionGroup
        tag="div"
        name="dopesheet-group"
        class="dopesheet-scroll"
      >
        <div v-for="row in rows" :key="row.node" class="dopesheet-group">
          <AtelierDopesheetLane
            summary
            :keys="summaryKeys(row)"
            :current="keyTime(row)"
          >
            <button
              class="dopesheet-fold"
              :aria-label="folded.has(row.node) ? 'Expand' : 'Collapse'"
              @click="fold(row.node)"
            >
              <div
                :class="[
                  'dopesheet-fold-icon i-carbon-caret-down',
                  folded.has(row.node) && 'is-folded',
                ]"
              ></div>
            </button>
            <div
              :class="[
                'dopesheet-node-icon',
                getNodeType(row.type)?.icon ?? 'i-carbon-help',
              ]"
            ></div>
            <span class="dopesheet-node-name">{{ row.name }}</span>
            <span class="dopesheet-muted">
              {{ trackCount(row) }}
            </span>
          </AtelierDopesheetLane>
          <Transition name="dopesheet-fold">
            <div v-if="!folded.has(row.node)" class="dopesheet-fold-rows">
              <div class="dopesheet-fold-inner">
                <AtelierDopesheetLane
                  v-if="row.stateKeys.length"
                  state
                  :keys="row.stateKeys"
                  :current="keyTime(row)"
                  @move="(from, to) => onMoveState(row.node, from, to)"
                  @remove="(t) => onRemoveState(row.node, t)"
                >
                  <span class="dopesheet-property">state</span>
                  <span class="dopesheet-muted">{{ stateName(row) }}</span>
                </AtelierDopesheetLane>
                <AtelierDopesheetLane
                  v-for="(track, i) in row.tracks"
                  :key="i"
                  :keys="track.keys"
                  :current="keyTime(row)"
                  @move="(from, to) => onMoveKey(row.node, track, from, to)"
                  @remove="(t) => onRemoveKey(row.node, track, t)"
                >
                  <span class="dopesheet-property">{{
                    track.path.join(".")
                  }}</span>
                  <span class="dopesheet-muted">{{
                    shownValue(row, track)
                  }}</span>
                  <button
                    class="dopesheet-key-toggle"
                    :aria-label="hasKey(row, track) ? 'Remove key' : 'Add key'"
                    @click="toggleKey(row, track)"
                  >
                    <div
                      :class="[
                        'dopesheet-key-toggle-icon',
                        hasKey(row, track) && 'is-on',
                      ]"
                    ></div>
                  </button>
                </AtelierDopesheetLane>
              </div>
            </div>
          </Transition>
        </div>
      </TransitionGroup>
      <AtelierDopesheetNavigator />
      <div class="dopesheet-overlay">
        <div ref="timeBox" class="dopesheet-overlay-time">
          <div
            v-if="end > 0"
            class="dopesheet-end"
            :style="{ left: timePercent(end, view) }"
          />
          <Transition name="fade-fast">
            <div
              v-if="inView(shownTime, view)"
              class="dopesheet-playhead"
              :style="{ left: timePercent(shownTime, view) }"
            >
              <span class="dopesheet-head">{{ toSeconds(shownTime) }}</span>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.dopesheet {
  @apply flex flex-col flex-1 min-h-0;
  @apply [--dopesheet-label:20rem] [--dopesheet-pad:1.5rem];

  .dopesheet-body {
    @apply relative flex flex-col flex-1 min-h-0;

    &::before {
      @apply content-[''] absolute inset-y-0 left-[var(--dopesheet-label)];
      @apply w-0.5 bg-dark-200 pointer-events-none;
    }
  }

  .dopesheet-header {
    @apply flex shrink-0 h-10;
    @apply border-solid border-0 border-b-2 border-dark-200;
  }

  .dopesheet-header-label {
    @apply flex items-center shrink-0 w-[var(--dopesheet-label)] px-5;
    @apply ui-text-3 font-200 uppercase opacity-60;
  }

  .dopesheet-scroll {
    @apply relative flex-1 min-h-0 overflow-y-auto [scrollbar-width:none];
  }

  .dopesheet-fold,
  .dopesheet-key-toggle {
    @apply flex justify-center shrink-0 w-4;
    @apply border-none bg-transparent text-inherit cursor-pointer;
    @apply opacity-60 hover:opacity-100 transition-opacity duration-150;
  }

  .dopesheet-fold-icon {
    @apply transition-transform duration-200;

    &.is-folded {
      @apply -rotate-90;
    }
  }

  .dopesheet-fold-rows {
    @apply grid grid-rows-[1fr];
  }

  .dopesheet-fold-inner {
    @apply min-h-0 overflow-hidden;
  }

  .dopesheet-node-icon {
    @apply shrink-0 w-4 h-4;
  }

  .dopesheet-node-name {
    @apply truncate font-500;
  }

  .dopesheet-property {
    @apply truncate pl-12;
  }

  .dopesheet-muted {
    @apply shrink-0 ml-auto tabular-nums opacity-60;

    &:last-child {
      @apply mr-6;
    }
  }

  .dopesheet-key-toggle-icon {
    @apply w-2 h-2 rotate-45;
    @apply border-solid border-1 border-light-200;
    @apply transition-colors duration-150;

    &.is-on {
      @apply bg-accent border-accent;
    }
  }

  .dopesheet-overlay {
    @apply absolute inset-y-0 right-0 left-[var(--dopesheet-label)];
    @apply overflow-hidden pointer-events-none;
  }

  .dopesheet-overlay-time {
    @apply absolute inset-y-0 inset-x-[var(--dopesheet-pad)];
  }

  .dopesheet-end {
    @apply absolute inset-y-0 right-[calc(-1*var(--dopesheet-pad))];
    @apply border-solid border-0 border-l-1 border-dashed border-light-200/30;
    @apply bg-dark-900/40;
  }

  .dopesheet-playhead {
    @apply absolute top-2 bottom-0 w-px bg-accent;
  }

  .dopesheet-head {
    @apply absolute -top-0.5 left-0 -translate-x-1/2;
    @apply px-1.5 py-0.5 border-rd bg-accent;
    @apply ui-text-3 leading-none font-500 tabular-nums text-dark-900;
  }

  .dopesheet-fold-enter-active,
  .dopesheet-fold-leave-active {
    @apply transition-[grid-template-rows] duration-200;
  }

  .dopesheet-fold-enter-from,
  .dopesheet-fold-leave-to {
    @apply grid-rows-[0fr];
  }

  .dopesheet-group-enter-active,
  .dopesheet-group-leave-active,
  .dopesheet-group-move {
    @apply transition-all duration-200;
  }

  .dopesheet-group-leave-active {
    @apply absolute inset-x-0;
  }

  .dopesheet-group-enter-from,
  .dopesheet-group-leave-to {
    @apply opacity-0 -translate-y-1;
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{ rows: DopesheetRow[] }>();

const { patchAnimation } = useDeckStore();
const { view, end, playing, pause, zoom, pan, nodeTime, keyTime } =
  usePlayhead();
const { shownTime, overrun } = usePlayheadDisplay(() => props.rows);

watch(shownTime, (t) => {
  if (playing.value && !inView(t, view)) pan(t - view.start);
});

provide(SNAP_TARGETS, () => [
  ...props.rows.flatMap((row) => keyTimes(row)),
  ...rulerTicks(view).minor,
]);

const folded = reactive(new Set<string>());

const fold = (node: string) => folded.delete(node) || folded.add(node);

function trackCount(row: DopesheetRow) {
  const n = row.tracks.length + (row.stateKeys.length ? 1 : 0);

  return `${n} ${n === 1 ? "track" : "tracks"}`;
}

const summaryKeys = (row: DopesheetRow) =>
  sortedKeyTimes(row).map((t) => ({ t }));

function stateName(row: DopesheetRow) {
  const state = stateAt(row.stateKeys, nodeTime(row));

  return (state && (state.t >= 1 ? state.to : state.from)) || "base";
}

function shownValue(row: DopesheetRow, track: Track) {
  const value = valueAt(track.keys, nodeTime(row));

  if (typeof value !== "number") return value;

  const unit = getComponentType(track.type)?.units?.[track.path[0]!] ?? "";

  return `${value.toFixed(1)}${unit}`;
}

const hasKey = (row: DopesheetRow, track: Track) =>
  track.keys.some((k) => k.t === keyTime(row));

function toggleKey(row: DopesheetRow, track: Track) {
  const t = keyTime(row);

  if (hasKey(row, track)) return onRemoveKey(row.node, track, t);

  patchAnimation(row.node, (data) => ({
    tracks: upsertKey(
      data.tracks,
      track.type,
      track.path,
      t,
      valueAt(track.keys, t)!,
    ),
  }));
}

const timeBox = useTemplateRef<HTMLElement>("timeBox");

const msPerPx = () => view.span / timeBox.value!.clientWidth;

function onWheel(event: WheelEvent) {
  const scale = wheelScale(event);
  const sideways = event.deltaX || (event.shiftKey ? event.deltaY : 0);

  if (sideways) {
    event.preventDefault();

    return pan(sideways * scale * msPerPx());
  }

  const onRuler = (event.target as Element).closest(".dopesheet-ruler");

  if (!onRuler && !event.ctrlKey) return;

  event.preventDefault();

  zoom(
    event.deltaY * scale,
    timeAtPointer(timeBox.value!.getBoundingClientRect(), event.clientX, view),
  );
}

const drag = usePointerDrag();

function startPan(event: PointerEvent) {
  if (event.button !== 1) return;

  event.preventDefault();

  const ms = msPerPx();
  let x = event.clientX;

  drag.start(null, (e) => {
    pan((x - e.clientX) * ms);
    x = e.clientX;
  });
}

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

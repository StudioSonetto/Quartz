<template>
  <NodeComponent
    name="animation"
    :icon="props.icon"
    :components="props.components"
  >
    <template v-if="component">
      <NodeComponentRow name="loop">
        <NodeComponentRowFieldSelect
          :options="[{ value: '', label: 'off' }, 'on', 'mirror']"
          :value="component.data.loop ?? ''"
          @update:value="setLoop"
        />
      </NodeComponentRow>
      <NodeComponentRow name="playhead">
        <div class="animation-at">
          <UIButton
            variant="icon"
            aria-label="Previous key"
            :disabled="prev === undefined"
            @click="seek(prev!)"
          >
            <div class="i-carbon-chevron-left"></div>
          </UIButton>
          <span class="animation-time">{{ formatSeconds(now) }}</span>
          <UIButton
            variant="icon"
            aria-label="Next key"
            :disabled="next === undefined"
            @click="seek(next!)"
          >
            <div class="i-carbon-chevron-right"></div>
          </UIButton>
        </div>
      </NodeComponentRow>
      <NodeComponentRow v-for="row in rows" :key="row.id" :name="row.label">
        <p v-if="row.from === undefined" class="animation-muted">first key</p>
        <div v-else class="animation-key">
          <p class="animation-muted">from {{ formatSeconds(row.from) }}</p>
          <NodeComponentRowFieldSelect
            class="animation-easing"
            :options="row.options"
            :value="row.easing"
            @update:value="row.set"
          />
        </div>
      </NodeComponentRow>
      <NodeComponentRow v-if="!rows.length" name="keys">
        <p class="animation-muted">No key at {{ formatSeconds(now) }}.</p>
      </NodeComponentRow>
    </template>
    <NodeComponentRow v-else name="keys">
      <p class="animation-muted">Select one node.</p>
    </NodeComponentRow>
  </NodeComponent>
</template>

<style scoped lang="postcss">
.animation-at {
  @apply flex items-center gap-2;
}

.animation-time {
  @apply tabular-nums;
}

.animation-key {
  @apply flex items-center gap-2 flex-1 min-w-0;
}

.animation-easing {
  @apply flex-1 min-w-0;
}

.animation-muted {
  @apply m-0 opacity-60 whitespace-nowrap;
}
</style>

<script setup lang="ts">
const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { patchAnimation } = useDeckStore();
const { keyTime, seek } = usePlayhead();

const component = computed(() =>
  props.components.length === 1 ? props.components[0] : undefined,
);

const now = computed(() => keyTime(component.value?.data));

function setLoop(loop: string) {
  const target = component.value;

  if (target) patchAnimation(target.node, () => ({ loop: loop || undefined }));
}

const STATE_EASING_OPTIONS = [
  { value: "", label: "state's easing" },
  ...EASING_OPTIONS,
];

const lastBefore = (times: number[], t: number) =>
  times.filter((time) => time < t).at(-1);

const times = computed(() =>
  [...new Set(keyTimes(component.value?.data))].sort((a, b) => a - b),
);

const prev = computed(() => lastBefore(times.value, now.value));
const next = computed(() => times.value.find((t) => t > now.value));

const rows = computed(() => {
  const target = component.value;

  if (!target) return [];

  const t = now.value;
  const stateKeys: StateKey[] = target.data.stateKeys ?? [];
  const state = stateKeys.find((key) => key.t === t);

  const stateRows = state
    ? [
        {
          id: "state",
          label: `state: ${state.name || "base"}`,
          from: lastBefore(
            stateKeys.map((k) => k.t),
            t,
          ),
          easing: state.easing ?? "",
          options: STATE_EASING_OPTIONS,
          set: (easing: string) =>
            patchAnimation(target.node, (data) => ({
              stateKeys: setEasingAt(data.stateKeys, t, easing || undefined),
            })),
        },
      ]
    : [];

  const trackRows = ((target.data.tracks ?? []) as Track[]).flatMap((track) => {
    const key = track.keys.find((k) => k.t === t);

    if (!key) return [];

    return {
      id: `${track.type}:${track.path.join(".")}`,
      label: track.path.join("."),
      from: lastBefore(
        track.keys.map((k) => k.t),
        t,
      ),
      easing: key.easing ?? "linear",
      options: EASING_OPTIONS,
      set: (easing: string) =>
        patchAnimation(target.node, (data) => ({
          tracks: setKeyEasing(
            data.tracks,
            track.type,
            track.path,
            t,
            easing === "linear" ? undefined : easing,
          ),
        })),
    };
  });

  return [...stateRows, ...trackRows];
});
</script>

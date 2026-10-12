<template>
  <div :class="['dopesheet-lane', props.summary && 'is-summary']">
    <div class="dopesheet-lane-label">
      <slot />
    </div>
    <div class="dopesheet-lane-cell">
      <div ref="lane" class="dopesheet-lane-time">
        <div
          v-if="props.keys.length > 1"
          class="dopesheet-lane-span"
          :style="spanStyle(props.keys[0]!.t, props.keys.at(-1)!.t, view)"
        />
        <div
          v-for="key in props.keys.filter((k) => inView(k.t, view))"
          :key="key.t"
          :class="[
            'dopesheet-lane-key',
            props.state && 'is-state',
            key.easing && key.easing !== 'linear' && 'is-eased',
            key.t === props.current && 'is-current',
          ]"
          :style="{ left: timePercent(key.t, view) }"
          :title="props.state ? key.name || 'base' : undefined"
          @pointerdown="onPress($event, key)"
          @dblclick="emit('remove', key.t)"
          @contextmenu.prevent="!props.summary && openMenu($event, key)"
        >
          <span v-if="props.state" class="dopesheet-lane-key-name">
            {{ key.name || "base" }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.dopesheet-lane {
  @apply flex h-8;
  @apply hover:bg-light-200/5 transition-colors duration-150;

  &.is-summary {
    @apply bg-light-200/3 hover:bg-light-200/5;
  }

  .dopesheet-lane-label {
    @apply flex items-center gap-2 shrink-0 min-w-0;
    @apply w-[var(--dopesheet-label)] px-5;
    @apply ui-text-3;
  }

  .dopesheet-lane-cell {
    @apply flex-1 min-w-0 px-[var(--dopesheet-pad)];
  }

  .dopesheet-lane-time {
    @apply relative h-full;
  }

  .dopesheet-lane-span {
    @apply absolute top-1/2 -translate-y-1/2;
    @apply h-0.5 bg-light-200/15;
  }

  .dopesheet-lane-key {
    @apply absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45;
    @apply w-2.5 h-2.5;
    @apply border-solid border-1 border-dark-900 bg-light-200;
    @apply cursor-ew-resize hover:scale-125;
    @apply transition-[background-color,transform] duration-150;

    &.is-state {
      @apply rotate-0;
    }

    &.is-eased {
      @apply border-rd-full;
    }

    &.is-current {
      @apply bg-accent;
    }

    .dopesheet-lane-key-name {
      @apply absolute left-3.5 top-1/2 -translate-y-1/2;
      @apply ui-text-3 whitespace-nowrap opacity-60;
      @apply pointer-events-none;
    }
  }

  &.is-summary .dopesheet-lane-key {
    @apply w-2 h-2 bg-light-200/50 cursor-pointer;
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  keys: { t: number; name?: string; easing?: string }[];
  current: number;
  state?: boolean;
  summary?: boolean;
}>();

const emit = defineEmits<{
  move: [from: number, to: number];
  remove: [t: number];
}>();

const { view, seek } = usePlayhead();

function openMenu(event: MouseEvent, key: { t: number }) {
  useContextMenu().open(event, [
    {
      label: "Remove",
      icon: "i-carbon-trash-can",
      danger: true,
      action: () => emit("remove", key.t),
    },
  ]);
}

const lane = useTemplateRef<HTMLElement>("lane");

const startDrag = useKeyDrag(
  () => lane.value,
  () => props.keys,
  emit,
);

// A summary key stands for several, so it only jumps the playhead.
function onPress(event: PointerEvent, key: { t: number }) {
  if (!props.summary) return startDrag(event, key);
  if (event.button === 0) seek(key.t);
}
</script>

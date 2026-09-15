<template>
  <div class="dopesheet-lane">
    <p
      class="dopesheet-lane-label"
      title="Click a key to edit it in the animation panel"
    >
      {{ props.label }}
    </p>
    <div ref="lane" class="dopesheet-lane-track">
      <div
        v-for="key in props.keys"
        :key="key.t"
        :class="[
          'dopesheet-lane-key',
          props.state && 'is-state',
          key.easing && key.easing !== 'linear' && 'is-eased',
        ]"
        :style="{ left: timePercent(key.t, props.duration) }"
        :title="props.state ? key.name || 'base' : undefined"
        @pointerdown="startDrag($event, key)"
        @dblclick="emit('remove', key.t)"
        @contextmenu.prevent="openMenu($event, key)"
      >
        <span v-if="props.state" class="dopesheet-lane-key-name">
          {{ key.name || "base" }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.dopesheet-lane {
  @apply flex items-center gap-3 h-6;

  .dopesheet-lane-label {
    @apply ui-text-3 opacity-60 truncate w-[var(--dopesheet-label)];
  }

  .dopesheet-lane-track {
    @apply relative flex-1 h-full;
  }

  .dopesheet-lane-key {
    @apply absolute top-1/2 w-2 h-2 rotate-45;
    @apply bg-accent -translate-x-1/2 -translate-y-1/2 cursor-ew-resize;

    &.is-state {
      @apply rotate-0 bg-light-200;
    }

    &.is-eased {
      @apply border-rd-full;
    }

    .dopesheet-lane-key-name {
      @apply absolute left-3 top-1/2 -translate-y-1/2;
      @apply ui-text-5 opacity-60 whitespace-nowrap pointer-events-none;
    }
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  keys: { t: number; name?: string; easing?: string }[];
  duration: number;
  state?: boolean;
}>();

const emit = defineEmits<{
  move: [from: number, to: number];
  remove: [t: number];
}>();

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
  () => props.duration,
  () => props.keys,
  emit,
);
</script>

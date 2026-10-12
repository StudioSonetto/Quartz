<template>
  <div class="dopesheet-navigator">
    <div ref="bar" class="dopesheet-navigator-bar">
      <div
        class="dopesheet-navigator-thumb"
        :style="{ left: percent(view.start), width: percent(view.span) }"
        @pointerdown="startDrag($event, 'move')"
      >
        <div
          class="dopesheet-navigator-handle is-start"
          @pointerdown.stop="startDrag($event, 'start')"
        />
        <div
          class="dopesheet-navigator-handle is-end"
          @pointerdown.stop="startDrag($event, 'end')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.dopesheet-navigator {
  @apply flex items-center gap-3 h-2 mb-2 px-[var(--dopesheet-gutter)];
  @apply overflow-hidden [scrollbar-gutter:stable];

  &::before {
    @apply content-[''] shrink-0 w-[var(--dopesheet-label)];
  }

  .dopesheet-navigator-bar {
    @apply relative flex-1 h-1.5 border-rd-full bg-dark-200;
  }

  .dopesheet-navigator-thumb {
    @apply absolute inset-y-0 max-w-full border-rd-full;
    @apply bg-light-200/25 hover:bg-light-200/40 cursor-grab;
    @apply transition-colors duration-150;
  }

  .dopesheet-navigator-handle {
    @apply absolute inset-y-0 w-2 cursor-ew-resize;

    &.is-start {
      @apply left-0;
    }

    &.is-end {
      @apply right-0;
    }
  }
}
</style>

<script setup lang="ts">
const { view, limit, pan, moveTo, resize } = usePlayhead();

const bar = useTemplateRef<HTMLElement>("bar");

const percent = (t: number) => `${(t / limit.value) * 100}%`;

const drag = usePointerDrag();

function startDrag(event: PointerEvent, part: "move" | "start" | "end") {
  if (event.button !== 0) return;

  event.preventDefault();

  const box = bar.value!.getBoundingClientRect();
  const timeAt = (x: number) =>
    Math.min(Math.max((x - box.left) / box.width, 0), 1) * limit.value;

  let x = event.clientX;

  drag.start(null, (e) => {
    if (part === "move") pan(((e.clientX - x) / box.width) * limit.value);
    else if (part === "end") resize(timeAt(e.clientX) - view.start);
    else {
      const end = view.start + view.span;

      resize(end - timeAt(e.clientX));
      moveTo(end - view.span);
    }

    x = e.clientX;
  });
}
</script>

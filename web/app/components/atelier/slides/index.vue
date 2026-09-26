<template>
  <div ref="list" @wheel.passive="handleScroll" class="slides-list">
    <TransitionGroup name="list">
      <AtelierSlidesThumb
        v-for="slide in slides"
        :key="slide.id"
        :index="slide.index"
      />
      <button
        key="new"
        :class="{ 'opacity-100! cursor-not-allowed': insertingSlides }"
        @click="insertNewSlides"
      >
        <div
          :class="{ 'animate-spin': insertingSlides }"
          class="i-carbon-add"
        />
      </button>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="postcss">
.slides-list {
  @apply flex flex-1 min-h-0 scroll-px-[5ch] p-[2.5ch];
  @apply overflow-x-auto overflow-y-hidden;

  & > * {
    @apply flex-shrink-0;
  }

  button {
    @apply aspect-video opacity-60 transition-opacity;
    @apply border-1 border-rd border-solid b-light-200;
    @apply flex items-center justify-center min-w-[100px];

    div {
      @apply text-5xl! origin-center;
      @apply animate-duration-1500 animate-delay-600;
    }

    &:hover {
      @apply opacity-100;
    }
  }

  .list-enter-active,
  .list-leave-active {
    @apply transition-all duration-300;
  }

  .list-enter-from,
  .list-leave-to {
    @apply opacity-0;
    @apply translate-y-10;
  }

  .slide-thumb:not(:last-child) {
    @apply mr-[2.5ch];
  }
}
</style>

<script setup lang="ts">
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";
import { useDraggable } from "vue-draggable-plus";

const deckStore = useDeckStore();
const { slides, insertingSlides } = storeToRefs(deckStore);

const list = useTemplateRef<HTMLDivElement>("list");

const WHEEL_MS = 100;

let target = 0;
let tween: AnimationPlaybackControls | undefined;

function handleScroll(event: WheelEvent) {
  const el = list.value;

  if (!el || !event.deltaY) return;

  target = Math.min(
    Math.max((tween ? target : el.scrollLeft) + event.deltaY, 0),
    el.scrollWidth - el.clientWidth,
  );

  tween?.stop();

  tween = animate(el.scrollLeft, target, {
    duration: WHEEL_MS / 1000,
    ease: "linear",
    onUpdate: (x) => (el.scrollLeft = x),
    onComplete: () => (tween = undefined),
  });
}

onUnmounted(() => tween?.stop());

function insertNewSlides() {
  return deckStore.insertNewSlides(useRoute().params.id?.toString() ?? "");
}

useDraggable(list, slides, {
  draggable: ".slide-thumb",
  animation: 200,
  onEnd: (event) => {
    const { oldDraggableIndex, newDraggableIndex } = event;

    if (oldDraggableIndex === undefined || newDraggableIndex === undefined)
      return;
    if (oldDraggableIndex === newDraggableIndex) return;

    const previous = slides.value.map((s) => s.id);
    const [moved] = previous.splice(newDraggableIndex, 1);

    if (!moved) return;

    previous.splice(oldDraggableIndex, 0, moved);

    deckStore.reorderSlides(previous).catch(() => {});
  },
});
</script>

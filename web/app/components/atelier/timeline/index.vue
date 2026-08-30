<template>
  <div ref="timeline" @wheel="handleScroll" class="timeline">
    <TransitionGroup name="list">
      <AtelierTimelineFrame
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
.timeline {
  @apply flex scroll-smooth;
  @apply bg-dark-800 h-[15vh] w-full p-[2.5ch];
  @apply overflow-x-auto overflow-y-hidden;
  @apply border-solid border-0 border-t-2 border-dark-200;

  & > * {
    @apply flex-shrink-0;
  }

  .list-move,
  .list-enter-active,
  .list-leave-active {
    @apply transition-all duration-300;
  }

  .list-enter-from,
  .list-leave-to {
    @apply opacity-0;
    @apply translate-y-10;
  }

  .list-leave-active {
    @apply absolute;
  }

  .frame:not(:last-child) {
    @apply mr-[2.5ch];
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

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
}
</style>

<script setup lang="ts">
import { useDraggable } from "vue-draggable-plus";

const deckStore = useDeckStore();
const { slides, insertingSlides } = storeToRefs(useDeckStore());

const timeline = useTemplateRef<HTMLDivElement>("timeline");

const { x } = useScroll(timeline, { behavior: "smooth" });

const wheelDelta = ref(0);

const handleScroll = (event: WheelEvent) => {
  if (event.deltaY !== 0) {
    wheelDelta.value = event.deltaY * 10;
  }
};

const throttle = useFrameThrottle();

watchThrottled(
  wheelDelta,
  (delta) => {
    if (delta !== 0) {
      x.value += delta;

      wheelDelta.value = 0;
    }
  },
  { throttle },
);

function insertNewSlides() {
  return deckStore.insertNewSlides(useRoute().params.id?.toString() ?? "");
}

useDraggable(timeline, slides, {
  draggable: ".frame",
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

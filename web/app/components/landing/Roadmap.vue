<template>
  <div ref="pin" :style="{ height: `calc(100dvh + ${distance}px)` }">
    <div class="roadmap-sticky">
      <LandingSection title="Roadmap" description="Polishing never stops.">
        <ol ref="track" role="list" class="roadmap-grid">
          <li
            v-for="(stage, i) in stages"
            :key="stage.label"
            :class="`roadmap-tile--${stage.status}`"
            class="roadmap-tile"
          >
            <span class="roadmap-number">{{
              String(i + 1).padStart(2, "0")
            }}</span>
            <div :class="stage.icon" class="text-5xl mb-3" />
            <p>{{ stage.label }}</p>
            <span class="roadmap-status">{{ stage.status }}</span>
          </li>
        </ol>
      </LandingSection>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.roadmap-sticky {
  @apply sticky top-0 h-dvh flex flex-col justify-center overflow-hidden;

  section {
    @apply py-0;
  }

  .roadmap-grid {
    @apply flex gap-3 w-max list-none;
  }
}

.roadmap-tile {
  @apply relative flex flex-col items-center justify-center gap-3;
  @apply flex-shrink-0 aspect-square p-6;
  @apply w-[min(15rem,45dvh)] sm:w-[min(25rem,45dvh)];
  @apply border-rd bg-light-200/4 select-none;

  &.roadmap-tile--now {
    @apply bg-accent/40;
  }

  &.roadmap-tile--polish {
    @apply bg-accent/20;
  }

  &.roadmap-tile--next {
    @apply opacity-60;
  }

  p {
    @apply ui-text-3 text-center;
  }

  .roadmap-number {
    @apply absolute top-6 left-6 ui-text-3 text-light-200/60;
  }

  .roadmap-status {
    @apply absolute bottom-6 ui-text-3 uppercase text-light-200/60;
  }
}
</style>

<script setup lang="ts">
import { clamp } from "@vueuse/core";

const pin = useTemplateRef<HTMLDivElement>("pin");
const track = useTemplateRef<HTMLOListElement>("track");

const { top } = useElementBounding(pin);
const { width: trackWidth } = useElementSize(track);
const { width: viewWidth } = useElementSize(() => track.value?.parentElement);

const distance = computed(() =>
  Math.max(trackWidth.value - viewWidth.value, 0),
);
const shift = computed(() => clamp(-top.value, 0, distance.value));

watch(shift, (x) => {
  if (track.value) track.value.style.transform = `translateX(${-x}px)`;
});

const stages = [
  {
    label: "Basic Nodes & Components",
    icon: "i-carbon-tree-view",
    status: "done",
  },
  { label: "Keyboard Controls", icon: "i-carbon-keyboard", status: "polish" },
  { label: "Timelines", icon: "i-carbon-movement", status: "polish" },
  { label: "States & Variables", icon: "i-carbon-parameter", status: "now" },
  { label: "3D/WebGL Module", icon: "i-carbon-cube", status: "now" },
  { label: "Interactivity", icon: "i-carbon-touch-1", status: "next" },
  {
    label: "Personalisation",
    icon: "i-carbon-color-palette",
    status: "next",
  },
  {
    label: "Discord Integration",
    icon: "i-carbon-logo-discord",
    status: "next",
  },
  { label: "Templates", icon: "i-carbon-template", status: "next" },
  { label: "Community Features", icon: "i-carbon-events", status: "next" },
  {
    label: "AI Features",
    icon: "i-carbon-magic-wand",
    status: "next",
  },
  {
    label: "More Modules",
    icon: "i-carbon-plug",
    status: "next",
  },
];
</script>

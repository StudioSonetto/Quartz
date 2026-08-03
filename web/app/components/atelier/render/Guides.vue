<template>
  <div data-html2canvas-ignore class="guides">
    <span
      v-for="(g, i) in guides"
      :key="i"
      class="guide"
      :class="g.axis === 'x' ? 'v' : 'h'"
      :style="lineStyle(g)"
    ></span>
  </div>
</template>

<style scoped lang="postcss">
.guides {
  @apply absolute inset-0 z-99 pointer-events-none;

  .guide {
    @apply absolute bg-accent;
  }

  .guide.v {
    @apply w-px;
  }

  .guide.h {
    @apply h-px;
  }
}
</style>

<script setup lang="ts">
import type { SnapLine } from "~/utils/snapping";

const props = defineProps<{ guides: SnapLine[] }>();
const { canvasSize } = storeToRefs(useAtelierStore());

// Guide positions are in canvas units; convert to % of the canvas box. When a
// line carries a `from`/`to` span (element-to-element) it is drawn only across
// that range; otherwise (canvas edges/centre) it spans the whole canvas.
function lineStyle(g: SnapLine) {
  const { width, height } = canvasSize.value;

  if (g.axis === "x") {
    const left = `${(g.pos / width) * 100}%`;

    if (g.from != null && g.to != null) {
      return {
        left,
        top: `${(g.from / height) * 100}%`,
        height: `${((g.to - g.from) / height) * 100}%`,
      };
    }

    return { left, top: "0", height: "100%" };
  }

  const top = `${(g.pos / height) * 100}%`;

  if (g.from != null && g.to != null) {
    return {
      top,
      left: `${(g.from / width) * 100}%`,
      width: `${((g.to - g.from) / width) * 100}%`,
    };
  }

  return { top, left: "0", width: "100%" };
}
</script>

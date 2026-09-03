<template>
  <svg
    class="element-paint"
    :viewBox="props.paint.viewBox"
    preserveAspectRatio="none"
  >
    <path
      :d="props.paint.d"
      :fill="props.paint.fill"
      :stroke="props.paint.stroke"
      :stroke-width="props.paint.strokeWidth"
    />
  </svg>
</template>

<style scoped lang="postcss">
.element-paint {
  @apply absolute inset-0 w-full h-full overflow-visible pointer-events-none;
}
</style>

<script setup lang="ts">
const props = defineProps<{ paint: NonNullable<RenderResult["paint"]> }>();
</script>

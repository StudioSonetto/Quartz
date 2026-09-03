<template>
  <div
    v-for="[id, box] in rects"
    :key="id"
    data-html2canvas-ignore
    class="node-outline"
    :style="{
      left: `${box.left + box.width / 2}px`,
      top: `${box.top + box.height / 2}px`,
      width: `${box.size.width}px`,
      height: `${box.size.height}px`,
      borderRadius: `${box.radius}px`,
      transform: `translate(-50%, -50%) rotate(${box.angle}deg)`,
    }"
  ></div>
</template>

<style scoped lang="postcss">
.node-outline {
  @apply absolute z-40 pointer-events-none;
  @apply outline outline-2 outline-accent;
}
</style>

<script setup lang="ts">
const { rects } = inject(nodeRectsKey)!;
</script>

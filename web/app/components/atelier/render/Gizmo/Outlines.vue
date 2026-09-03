<template>
  <TransitionGroup name="outline-fade">
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
  </TransitionGroup>
</template>

<style scoped lang="postcss">
.node-outline {
  @apply absolute z-40 pointer-events-none;
  @apply outline outline-2 outline-accent;
}

.outline-fade-enter-active,
.outline-fade-leave-active {
  @apply transition-opacity duration-100;
}

.outline-fade-enter-from,
.outline-fade-leave-to {
  @apply opacity-0;
}
</style>

<script setup lang="ts">
const { rects } = inject(nodeRectsKey)!;
</script>

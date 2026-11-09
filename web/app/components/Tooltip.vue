<template>
  <div class="tooltip">
    <slot />
    <span :class="placement">{{ description }}</span>
  </div>
</template>

<style scoped lang="postcss">
.tooltip {
  @apply relative;

  span {
    @apply absolute left-1/2 -translate-x-1/2 z-99 p-2 bg-dark-200 border-rd;
    @apply ui-text-3 font-normal text-center whitespace-nowrap;
    @apply opacity-0 invisible pointer-events-none transition-opacity;
    @apply [font-variant-ligatures:none];

    &.up {
      @apply bottom-full mb-3;
    }

    &.down {
      @apply top-full mt-3;
    }
  }

  &:hover span {
    @apply opacity-100 visible;
  }
}
</style>

<script setup lang="ts">
const { description, placement = "up" } = defineProps<{
  description: string;
  placement?: "up" | "down";
}>();
</script>
